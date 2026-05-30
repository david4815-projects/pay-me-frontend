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

function TotalReceived({ address, btcPrice }: { address: string; btcPrice: number | null }) {
  const [totalReceived, setTotalReceived] = useState<number | null>(null)

  useEffect(() => {
    const fetchTotal = () => {
      axios.get(`https://blockstream.info/api/address/${address}`)
        .then(res => {
          const satoshis: number = res.data.chain_stats.funded_txo_sum
          setTotalReceived(satoshis / 100_000_000)
        })
        .catch(() => {})
    }
    fetchTotal()
    const interval = setInterval(fetchTotal, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [address])

  if (totalReceived === null) return null

  return (
    <div className="total-received">
      <p className="total-label">Total donado</p>
      <p className="total-btc">{totalReceived.toFixed(8)} BTC</p>
      {btcPrice && (
        <p className="total-usd">
          ${(totalReceived * btcPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
        </p>
      )}
    </div>
  )
}

function BitcoinCard({ data, btcPrice }: { data: BitcoinAddress; btcPrice: number | null }) {
  const [copied, setCopied] = useState(false)
  const [usdAmount, setUsdAmount] = useState('')
  const [btcAmount, setBtcAmount] = useState('')

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
  const btcAmountForUri = btcAmount && btcFloat > 0
    ? btcFloat.toFixed(8).replace(/0+$/, '').replace(/\.$/, '')
    : null
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
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    axios.get('http://localhost:3000/addresses')
      .then(res => setBitcoin(res.data.bitcoin))
      .catch(() => setError(true))
  }, [])

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

  return (
    <div className="container">
      <header>
        <h1>Donar Bitcoin</h1>
        <p>Escaneá el QR o copiá la dirección</p>
      </header>

      {error && (
        <p className="error">No se pudo conectar con el servidor</p>
      )}

      {bitcoin && (
        <>
          <TotalReceived address={bitcoin.address} btcPrice={btcPrice} />
          <BitcoinCard data={bitcoin} btcPrice={btcPrice} />
        </>
      )}
    </div>
  )
}

export default App
