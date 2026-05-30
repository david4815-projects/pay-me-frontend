import { useEffect, useState } from 'react'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'
import './App.css'

interface CryptoAddress {
  address: string
  network: string
  uri: string
}

interface Addresses {
  bitcoin: CryptoAddress
  usdt: CryptoAddress
}

function CryptoCard({ data, icon }: { data: CryptoAddress; icon: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(data.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card">
      <div className="card-header">
        <span className="icon">{icon}</span>
        <h2>{data.network}</h2>
      </div>
      <div className="qr-wrapper">
        <QRCodeSVG value={data.uri} size={180} />
      </div>
      <p className="address">{data.address}</p>
      <div className="actions">
        <button onClick={handleCopy} className="btn-copy">
          {copied ? '✓ Copiado' : 'Copiar dirección'}
        </button>
        <a href={data.uri} className="btn-open">
          Abrir en wallet
        </a>
      </div>
    </div>
  )
}

function App() {
  const [addresses, setAddresses] = useState<Addresses | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    axios.get('http://localhost:3000/addresses')
      .then(res => setAddresses(res.data))
      .catch(() => setError(true))
  }, [])

  return (
    <div className="container">
      <header>
        <h1>Donar cripto</h1>
        <p>Elegí tu método preferido</p>
      </header>

      {error && (
        <p className="error">No se pudo conectar con el servidor</p>
      )}

      {addresses && (
        <div className="cards">
          <CryptoCard data={addresses.bitcoin} icon="₿" />
          <CryptoCard data={addresses.usdt} icon="₮" />
        </div>
      )}
    </div>
  )
}

export default App
