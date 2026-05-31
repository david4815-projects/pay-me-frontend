import { useEffect, useState } from 'react'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'
import './App.css'

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface VersusData {
  btcPrice: number
  totalBtc: number
  totalUsd: number
  address: string
}

const players = [
  { id: 'messi',   name: 'Messi',   flag: '🇦🇷', label: 'Argentina', image: '/messi.png' },
  { id: 'ronaldo', name: 'Ronaldo', flag: '🇵🇹', label: 'Portugal',  image: '/cr7.png'   },
]

function PlayerCard({
  player,
  btc,
  usd,
  address,
  btcAmountForUri,
}: {
  player: typeof players[0]
  btc: number
  usd: number
  address: string
  btcAmountForUri: string | null
}) {
  const [copied, setCopied] = useState(false)
  const uri = `bitcoin:${address}`
  const currentUri = btcAmountForUri ? `${uri}?amount=${btcAmountForUri}` : uri

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="player-card" style={{ backgroundImage: `url(${player.image})` }}>
      <div className="player-header">
        <span className="player-flag">{player.flag}</span>
        <h2 className="player-name">{player.name}</h2>
        <p className="player-label">{player.label}</p>
      </div>

      <div className="player-balance">
        <p className="player-btc">{btc.toFixed(8)} BTC</p>
        <p className="player-usd">
          ${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
        </p>
      </div>

      {/* QR solo en desktop */}
      {!isMobile && (
        btcAmountForUri ? (
          <>
            <div className="qr-wrapper">
              <QRCodeSVG value={currentUri} size={150} />
            </div>
            <p className="amount-display">{btcAmountForUri} BTC</p>
          </>
        ) : (
          <div className="qr-placeholder">
            <span className="qr-placeholder-icon">₿</span>
            <p>Ingresá un monto para generar el QR</p>
          </div>
        )
      )}

      <div className="card-actions">
        <button onClick={handleCopy} className="btn-copy">
          {copied ? '✓ Copiado' : 'Copiar dirección'}
        </button>
        {isMobile && (
          <a
            href={btcAmountForUri ? currentUri : undefined}
            className={`btn-open${btcAmountForUri ? '' : ' btn-disabled'}`}
            aria-disabled={!btcAmountForUri}
          >
            Abrir wallet
          </a>
        )}
      </div>
    </div>
  )
}

function App() {
  const [data, setData] = useState<VersusData | null>(null)
  const [error, setError] = useState(false)
  const [usdAmount, setUsdAmount] = useState('')
  const [btcAmount, setBtcAmount] = useState('')

  useEffect(() => {
    const fetchData = () => {
      axios.get(`${API_URL}/versus`)
        .then(res => setData(res.data))
        .catch(() => setError(true))
    }
    fetchData()
    const interval = setInterval(fetchData, 10_000)
    return () => clearInterval(interval)
  }, [])

  const handleUsdChange = (value: string) => {
    setUsdAmount(value)
    if (data?.btcPrice && value !== '') {
      const btc = parseFloat(value) / data.btcPrice
      setBtcAmount(isNaN(btc) ? '' : btc.toFixed(8))
    } else {
      setBtcAmount('')
    }
  }

  const handleBtcChange = (value: string) => {
    setBtcAmount(value)
    if (data?.btcPrice && value !== '') {
      const usd = parseFloat(value) * data.btcPrice
      setUsdAmount(isNaN(usd) ? '' : usd.toFixed(2))
    } else {
      setUsdAmount('')
    }
  }

  const btcFloat = parseFloat(btcAmount)
  const btcAmountForUri = btcAmount && btcFloat > 0
    ? btcFloat.toFixed(8).replace(/0+$/, '').replace(/\.$/, '')
    : null

  const totalBtc = data?.totalBtc ?? 0
  const totalUsd = data?.totalUsd ?? 0

  return (
    <div className="container">
      <header>
        <h1>⚽ Messi <span className="vs">vs</span> Ronaldo ⚽</h1>
        <p>Apoyá a tu jugador donando Bitcoin</p>
      </header>

      {error && <p className="error">No se pudo conectar con el servidor</p>}

      {data && (
        <>
          {/* Converter arriba — el usuario elige el monto antes de elegir jugador */}
          <div className="converter-section">
            <p className="converter-title">¿Cuánto querés donar?</p>
            <div className="converter">
              <div className="input-group">
                <label>USD</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={usdAmount}
                  onChange={e => handleUsdChange(e.target.value)}
                />
              </div>
              <span className="swap-icon">⇅</span>
              <div className="input-group">
                <label>BTC</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00000000"
                  value={btcAmount}
                  onChange={e => handleBtcChange(e.target.value)}
                />
              </div>
            </div>
            {data.btcPrice > 0 && (
              <p className="btc-price">1 BTC = ${data.btcPrice.toLocaleString('en-US')} USD</p>
            )}
          </div>

          <div className="progress-row">
            <span className="progress-label">Messi 50%</span>
            <div className="progress-bar">
              <div className="progress-messi" style={{ width: '50%' }} />
              <div className="progress-ronaldo" style={{ width: '50%' }} />
            </div>
            <span className="progress-label">50% Ronaldo</span>
          </div>

          <div className="versus-grid">
            <PlayerCard
              player={players[0]}
              btc={totalBtc}
              usd={totalUsd}
              address={data.address}
              btcAmountForUri={btcAmountForUri}
            />
            <div className="vs-divider">⚔️</div>
            <PlayerCard
              player={players[1]}
              btc={totalBtc}
              usd={totalUsd}
              address={data.address}
              btcAmountForUri={btcAmountForUri}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default App
