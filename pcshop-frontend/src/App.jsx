import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Scales, X as XIcon, Trash } from '@phosphor-icons/react'
import { imgUrl } from './utils/imgUrl'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import Wishlist from './pages/Wishlist'
import Profile from './pages/Profile'
import PCBuilder from './pages/PCBuilder'
import Chat from './pages/Chat'
import Admin from './pages/Admin'
import Compare from './pages/Compare'
import FAQ from './pages/FAQ'
import DespreNoi from './pages/DespreNoi'
import Contact from './pages/Contact'
import ChatWidget from './components/ChatWidget'
import Footer from './components/Footer'
import useCompareStore from './store/compareStore'

// Bara fixa de jos care apare cand utilizatorul a selectat produse pentru comparare
function CompareBar() {
  const { items, remove, clear } = useCompareStore()
  const navigate = useNavigate()
  if (items.length === 0) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999] bg-base/[0.97] backdrop-blur-xl
                    border-t border-accent/30 px-8 py-3 flex items-center gap-4
                    shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
      <span className="text-accent text-xs font-bold whitespace-nowrap flex items-center gap-1.5">
        <Scales size={14} weight="bold" />
        Comparare ({items.length}/3):
      </span>
      <div className="flex gap-2.5 flex-1 flex-wrap">
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-center gap-2 bg-accent-dim border border-accent-border
                       rounded-lg px-2.5 py-1.5"
          >
            {item.image_url && (
              <img
                src={imgUrl(item.image_url)}
                alt={item.name}
                className="w-7 h-7 object-cover rounded"
              />
            )}
            <span className="text-primary text-xs font-semibold max-w-[130px] truncate">
              {item.name}
            </span>
            <button
              onClick={() => remove(item.id)}
              className="bg-transparent border-none text-muted cursor-pointer
                         hover:text-danger transition-colors duration-150 flex items-center p-0"
            >
              <XIcon size={14} weight="bold" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => navigate('/compare')}
          className="bg-accent text-base border-none px-5 py-2 rounded-lg cursor-pointer
                     font-bold text-sm shadow-glow-cyan whitespace-nowrap
                     hover:shadow-[0_4px_16px_rgba(14,246,255,0.55)] hover:-translate-y-px
                     transition-all duration-150"
        >
          Compară acum
        </button>
        <button
          onClick={clear}
          className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-secondary
                     px-3 py-2 rounded-lg cursor-pointer text-xs
                     hover:text-danger hover:border-danger/30 transition-all duration-150"
        >
          <Trash size={13} weight="bold" /> Șterge
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-base">
        <Navbar />
        <main className="max-w-[1600px] mx-auto px-8 pt-6 pb-24">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/configurator" element={<PCBuilder />} />
            <Route path="/builder" element={<PCBuilder />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/despre-noi" element={<DespreNoi />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
        <ChatWidget />
        <CompareBar />
      </div>
    </BrowserRouter>
  )
}

export default App
