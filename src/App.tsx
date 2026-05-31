import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'
import './App.css'

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface PlayerData {
  address: string
  totalBtc: number
  totalUsd: number
  votes: number
  percent: number
}

interface VersusData {
  btcPrice: number
  totalRaisedUsd: number
  totalVotes: number
  messi: PlayerData
  ronaldo: PlayerData
}

const players = [
  { id: 'messi',   name: 'Messi',   flag: '🇦🇷', label: 'Argentina', image: '/messi.png' },
  { id: 'ronaldo', name: 'Ronaldo', flag: '🇵🇹', label: 'Portugal',  image: '/cr7.png'   },
]

function VoteModal({
  player,
  playerData,
  btcPrice,
  onClose,
}: {
  player: typeof players[0]
  playerData: PlayerData
  btcPrice: number
  onClose: () => void
}) {
  const [usdAmount, setUsdAmount] = useState('1')
  const [btcAmount, setBtcAmount] = useState('')
  const [copied, setCopied] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (btcPrice && !initialized.current) {
      initialized.current = true
      setBtcAmount((1 / btcPrice).toFixed(8))
    }
  }, [btcPrice])

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

  const uri = `bitcoin:${playerData.address}`
  const currentUri = btcAmountForUri ? `${uri}?amount=${btcAmountForUri}` : uri

  const handleCopy = () => {
    navigator.clipboard.writeText(playerData.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <span className="modal-flag">{player.flag}</span>
          <h2 className="modal-title">Vote for {player.name}</h2>
          <p className="modal-label">{player.label}</p>
        </div>

        <p className="converter-title">Choose your GOAT! 🐐</p>
        <p className="converter-subtitle">Donation amount</p>

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

        {btcPrice > 0 && (
          <p className="btc-price">1 BTC = ${btcPrice.toLocaleString('en-US')} USD</p>
        )}

        {btcAmountForUri ? (
          <div className="modal-qr">
            <div className="qr-wrapper">
              <QRCodeSVG value={currentUri} size={160} />
            </div>
            <p className="amount-display">{btcAmountForUri} BTC</p>
          </div>
        ) : (
          <div className="qr-placeholder modal-qr-placeholder">
            <span className="qr-placeholder-icon">₿</span>
            <p>Enter an amount to generate the QR</p>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={handleCopy} className="btn-copy">
            {copied ? '✓ Copied!' : '📋 Copy BTC Address'}
          </button>
          {isMobile && btcAmountForUri && (
            <a href={currentUri} className="btn-open">
              👛 Open Wallet
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function PlayerCard({
  player,
  playerData,
  onVote,
}: {
  player: typeof players[0]
  playerData: PlayerData
  onVote: () => void
}) {
  return (
    <div className="player-card" style={{ backgroundImage: `url(${player.image})` }}>
      <div className="player-header">
        <span className="player-flag">{player.flag}</span>
        <h2 className="player-name">{player.name}</h2>
      </div>

      <div className="player-balance">
        <p className="player-usd">
          ${playerData.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="player-votes">{playerData.votes} {playerData.votes === 1 ? 'vote' : 'votes'}</p>
      </div>

      <button className="btn-vote" onClick={onVote}>
        Vote for {player.name}
      </button>
    </div>
  )
}

function App() {
  const [data, setData] = useState<VersusData | null>(null)
  const [error, setError] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<'messi' | 'ronaldo' | null>(null)

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

  const leader = data
    ? data.messi.percent >= data.ronaldo.percent ? 'messi' : 'ronaldo'
    : null

  const bgImage = leader === 'messi' ? '/mesiFondo.png'
    : leader === 'ronaldo' ? '/cr7Fondo.png'
    : undefined

  const leadingBy = data ? Math.abs(data.messi.totalUsd - data.ronaldo.totalUsd) : 0
  const leaderName = data
    ? data.messi.percent > data.ronaldo.percent ? 'Messi'
    : data.ronaldo.percent > data.messi.percent ? 'Ronaldo'
    : null
    : null

  const selectedPlayerObj = selectedPlayer === 'messi' ? players[0] : players[1]
  const selectedPlayerData = selectedPlayer === 'messi' ? data?.messi : data?.ronaldo

  return (
    <div className="container">
      {bgImage && <div className="global-bg" style={{ backgroundImage: `url(${bgImage})` }} />}

      {error && <p className="error">Could not connect to server</p>}

      {data && (
        <>
          <div className="site-header">
            <p className="site-tagline">🏆 Community GOAT Battle</p>
            <p className="site-description">Every satoshi is a vote. Support your legend.</p>
          </div>

          <div className="stats-bar">
            <div className="stat">
              <span className="stat-value">${data.totalRaisedUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="stat-label">Total raised</span>
            </div>
            <div className="stat-divider">·</div>
            <div className="stat">
              <span className="stat-value">{data.totalVotes}</span>
              <span className="stat-label">Total votes</span>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-row">
              <span className="progress-label">Messi {data.messi.percent}%</span>
              <div className="progress-bar">
                <div className="progress-messi" style={{ width: `${data.messi.percent}%` }} />
                <div className="progress-ronaldo" style={{ width: `${data.ronaldo.percent}%` }} />
              </div>
              <span className="progress-label">{data.ronaldo.percent}% Ronaldo</span>
            </div>
            {leaderName && leadingBy > 0 && (
              <p className="leading-text">🏆 {leaderName} leading by ${leadingBy.toFixed(2)}</p>
            )}
          </div>

          <div className="versus-grid">
            <PlayerCard
              player={players[0]}
              playerData={data.messi}
              onVote={() => setSelectedPlayer('messi')}
            />
            <div className="vs-divider">⚔️</div>
            <PlayerCard
              player={players[1]}
              playerData={data.ronaldo}
              onVote={() => setSelectedPlayer('ronaldo')}
            />
          </div>

          {selectedPlayer && selectedPlayerData && (
            <VoteModal
              player={selectedPlayerObj}
              playerData={selectedPlayerData}
              btcPrice={data.btcPrice}
              onClose={() => setSelectedPlayer(null)}
            />
          )}
        </>
      )}
    </div>
  )
}

export default App
