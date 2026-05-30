import { useEffect, useState } from 'react'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'
import './App.css'

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

interface BitcoinAddress {
  address: string
  network: string
  uri: string
}

function BitcoinCard({ data }: { data: BitcoinAddress }) {
  const [copied, setCopied] = useState(false)
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [usdAmount, setUsdAmount] = useState('')
  const [btcAmount, setBtcAmount] = useState('')

  useEffect(() => {
    const fetchPrice = () => {
      axios.get('https://api.coinbase.com/v2/prices/BTC-USD/spot')
        .then(res => setBtcPrice(parseFloat(res.data.data.amount)))
        .catch(() => {})
    }
    fetchPrice()
    const interval = setInterval(fetchPrice, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleUsdChange = (value: string) => {
    setUsdAmount(value)
    if (btcPrice && value !== '') {
      const btc = parseFloat(value) / btcPrice
      setBtcAmount(isNaN(btc) ? '' : btc.toFixed(8))
    } else {
      setBtcAmount('')
    }
  }

  const handleBtcChange = (value: string) => {
    setBtcAmount(value)
    if (btcPrice && value !== '') {
      const usd = parseFloat(value) * btcPrice
      setUsdAmount(isNaN(usd) ? '' : usd.toFixed(2))
    } else {
      setUsdAmount('')
    }
  }

  const btcFloat = parseFloat(btcAmount)
  // Strip trailing zeros: 0.00010000 → "0.0001", avoids BIP21 parsing issues
  const btcAmountForUri = btcAmount && btcFloat > 0
    ? btcFloat.toFixed(8).replace(/0+$/, '').replace(/\.$/, '')
    : null
  // Exclude "0.00000000" which some wallets interpret as zero
  const currentUri = btcAmountForUri && btcAmountForUri !== '0'
    ? `${data.uri}?amount=${btcAmountForUri}`
    : data.uri

  const handleCopy = () => {
    navigator.clipboard.writeText(data.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="icon">₿</span>
        <h2>{data.network}</h2>
      </div>

      {btcPrice && (
        <p className="btc-price">1 BTC = ${btcPrice.toLocaleString('en-US')} USD</p>
      )}

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

      {btcAmountForUri ? (
        <>
          <div className="qr-wrapper">
            <QRCodeSVG value={currentUri} size={180} />
          </div>
          <p className="amount-display">{btcAmountForUri} BTC</p>
        </>
      ) : (
        <div className="qr-placeholder">
          <span className="qr-placeholder-icon">₿</span>
          <p>Ingresá un monto para generar el QR</p>
        </div>
      )}
      <p className="address">{data.address}</p>
      <div className="actions">
        <button onClick={handleCopy} className="btn-copy">
          {copied ? '✓ Copiado' : 'Copiar dirección'}
        </button>
        {isMobile && (
          <a
            href={btcAmountForUri ? currentUri : undefined}
            className={`btn-open${btcAmountForUri ? '' : ' btn-disabled'}`}
            aria-disabled={!btcAmountForUri}
          >
            Abrir en wallet
          </a>
        )}
      </div>
    </div>
  )
}

function App() {
  const [bitcoin, setBitcoin] = useState<BitcoinAddress | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    axios.get('http://localhost:3000/addresses')
      .then(res => setBitcoin(res.data.bitcoin))
      .catch(() => setError(true))
  }, [])

  return (
    <div className="container">
      <header>
        <h1>Donar Bitcoin</h1>
        <p>Escaneá el QR o copiá la dirección</p>
      </header>

      {error && (
        <p className="error">No se pudo conectar con el servidor</p>
      )}

      {bitcoin && <BitcoinCard data={bitcoin} />}
    </div>
  )
}

export default App
