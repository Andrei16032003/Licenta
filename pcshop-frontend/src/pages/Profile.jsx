import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { profileAPI, wishlistAPI, cartAPI, ordersAPI, retururiAPI, serviceAPI, vouchersAPI } from '../services/api'
import { imgUrl } from '../utils/imgUrl'
import useAuthStore from '../store/authStore'
import useCartStore from '../store/cartStore'
import {
  User, MapPin, Package, Tag, Heart, ShieldCheck,
  ArrowCounterClockwise, Wrench, GearSix, SignOut,
  Truck, Phone, EnvelopeSimple, CreditCard, Check, Warning,
  CircleNotch, Trash, Desktop,
  ShoppingCart, CalendarBlank, ClipboardText, MagnifyingGlass,
  Receipt, CaretDown, Printer, CurrencyDollar,
} from '@phosphor-icons/react'

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const { setCart } = useCartStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [addresses, setAddresses] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('ok')
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'personal')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

  const [addingToCart, setAddingToCart] = useState(null)
  const [orders, setOrders] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [orderDetails, setOrderDetails] = useState({})
  const [loadingDetail, setLoadingDetail] = useState(null)
  const [invoiceOrder, setInvoiceOrder] = useState(null)
  const [loadingInvoice, setLoadingInvoice] = useState(null)
  const [retururi, setRetururi] = useState([])
  const [showReturForm, setShowReturForm] = useState(false)
  const [returForm, setReturForm] = useState({
    order_id: '', product_name: '', product_id: '', motiv: '', motiv_detalii: '', stare_produs: '',
    pickup_address: { full_name: '', phone: '', street: '', city: '', county: '', postal_code: '' },
    refund_method: 'card', iban: '', titular_cont: '',
  })
  const [returSubmitting, setReturSubmitting] = useState(false)
  const [serviceRequests, setServiceRequests] = useState([])
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [serviceForm, setServiceForm] = useState({
    order_id: '', product_id: '', product_name: '', descriere: '',
    pickup_address: { full_name: '', phone: '', street: '', city: '', county: '', postal_code: '' },
    contact_telefon: '', contact_email: '',
  })
  const [serviceSubmitting, setServiceSubmitting] = useState(false)

  // voucher state
  const [vouchers, setVouchers] = useState([])
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherMsg, setVoucherMsg] = useState({ type: '', text: '' })
  const [voucherLoading, setVoucherLoading] = useState(false)

  const [newAddress, setNewAddress] = useState({
    label: 'Acasa', full_name: '', phone: '',
    county: '', city: '', street: '',
    postal_code: '', is_default: false,
  })

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    Promise.all([loadAddresses(), loadWishlist(), loadOrders(), loadRetururi(), loadService(), loadVouchers()]).finally(() => setLoading(false))
  }, [isAuthenticated])

  const loadAddresses = async () => {
    try {
      const res = await profileAPI.getAddresses(user.id)
      setAddresses(res.data)
    } catch (err) { console.error(err) }
  }

  const loadWishlist = async () => {
    try {
      const res = await wishlistAPI.get(user.id)
      setWishlist(res.data)
    } catch (err) { console.error(err) }
  }

  const loadVouchers = async () => {
    try {
      const res = await vouchersAPI.getMy(user.id)
      setVouchers(res.data)
    } catch (err) { console.error(err) }
  }

  const handleClaimVoucher = async () => {
    if (!voucherCode.trim()) return
    setVoucherLoading(true); setVoucherMsg({ type: '', text: '' })
    try {
      await vouchersAPI.claim({ code: voucherCode.trim(), user_id: user.id })
      setVoucherMsg({ type: 'ok', text: 'Voucher adaugat cu succes!' })
      setVoucherCode('')
      await loadVouchers()
    } catch (err) {
      setVoucherMsg({ type: 'err', text: err.response?.data?.detail || 'Cod invalid.' })
    } finally { setVoucherLoading(false) }
  }

  const loadOrders = async () => {
    try {
      const res = await ordersAPI.getUserOrders(user.id)
      setOrders(res.data)
    } catch (err) { console.error(err) }
  }

  // Expandeaza/colapeaza detalii comanda, fetch lazy la prima expandare
  const toggleExpand = async (orderId) => {
    if (expandedId === orderId) { setExpandedId(null); return }
    setExpandedId(orderId)
    if (orderDetails[orderId]) return
    setLoadingDetail(orderId)
    try {
      const res = await ordersAPI.getById(orderId)
      setOrderDetails(prev => ({ ...prev, [orderId]: res.data }))
    } catch (err) { console.error(err) }
    finally { setLoadingDetail(null) }
  }

  // Deschide modalul de factura pentru o comanda
  const openInvoice = async (e, orderId) => {
    e.stopPropagation()
    setLoadingInvoice(orderId)
    try {
      const res = await ordersAPI.getInvoice(orderId)
      setInvoiceOrder(res.data)
    } catch (err) { console.error(err) }
    finally { setLoadingInvoice(null) }
  }

  const loadRetururi = async () => {
    try {
      const res = await retururiAPI.get(user.id)
      setRetururi(res.data)
    } catch (err) { console.error(err) }
  }

  const handleReturSubmit = async (e) => {
    e.preventDefault()
    setReturSubmitting(true)
    try {
      await retururiAPI.create({ ...returForm, user_id: user.id })
      await loadRetururi()
      setShowReturForm(false)
      setReturForm({ order_id: '', product_name: '', product_id: '', motiv: '', motiv_detalii: '', stare_produs: '', pickup_address: { full_name: '', phone: '', street: '', city: '', county: '', postal_code: '' }, refund_method: 'card', iban: '', titular_cont: '' })
      setMessageType('ok'); setMessage('Cererea de retur a fost trimisa!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessageType('err'); setMessage(err.response?.data?.detail || 'Eroare la trimitere!')
      setTimeout(() => setMessage(''), 3000)
    } finally { setReturSubmitting(false) }
  }

  const loadService = async () => {
    try {
      const res = await serviceAPI.get(user.id)
      setServiceRequests(res.data)
    } catch (err) { console.error(err) }
  }

  const handleServiceSubmit = async (e) => {
    e.preventDefault()
    setServiceSubmitting(true)
    try {
      const res = await serviceAPI.create({ ...serviceForm, user_id: user.id })
      await loadService()
      setShowServiceForm(false)
      setServiceForm({ order_id: '', product_id: '', product_name: '', descriere: '', pickup_address: { full_name: '', phone: '', street: '', city: '', county: '', postal_code: '' }, contact_telefon: '', contact_email: '' })
      setMessageType('ok'); setMessage(`Cerere service trimisa! Ticket: ${res.data.nr_ticket}`)
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      setMessageType('err'); setMessage(err.response?.data?.detail || 'Eroare la trimitere!')
      setTimeout(() => setMessage(''), 3000)
    } finally { setServiceSubmitting(false) }
  }

  const handleAddAddress = async (e) => {
    e.preventDefault()
    try {
      await profileAPI.addAddress(user.id, { ...newAddress, user_id: user.id })
      setMessageType('ok'); setMessage('Adresa adaugata!')
      setShowAddForm(false)
      setNewAddress({ label: 'Acasa', full_name: '', phone: '', county: '', city: '', street: '', postal_code: '', is_default: false })
      loadAddresses()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) { setMessageType('err'); setMessage(err.response?.data?.detail || 'Eroare!') }
  }

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Stergi aceasta adresa?')) return
    try { await profileAPI.deleteAddress(user.id, addressId); loadAddresses() }
    catch (err) { console.error(err) }
  }

  const handleRemoveWishlist = async (productId) => {
    try {
      await wishlistAPI.remove(user.id, productId)
      setWishlist(prev => prev.filter(i => i.product_id !== productId))
    } catch (err) { console.error(err) }
  }

  const handleAddToCart = async (productId) => {
    setAddingToCart(productId)
    try {
      await cartAPI.add({ user_id: user.id, product_id: productId, quantity: 1 })
      const cartRes = await cartAPI.get(user.id)
      setCart(cartRes.data)
      setMessageType('ok'); setMessage('Produs adaugat in cos!')
      setTimeout(() => setMessage(''), 2500)
    } catch (err) {
      setMessageType('err'); setMessage(err.response?.data?.detail || 'Eroare!')
      setTimeout(() => setMessage(''), 3000)
    } finally { setAddingToCart(null) }
  }

  if (loading) return (
    <div className="text-center py-20 text-muted">Se incarca...</div>
  )

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>

      {/* Header card */}
      <div className="bg-surface border border-default rounded-2xl p-6 mb-5 flex items-center gap-5 shadow-card">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl font-bold text-dark font-display shrink-0 shadow-glow-cyan">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-primary font-display font-bold text-xl mb-2">{user?.name}</h2>
          <div className="flex gap-2 flex-wrap">
            <span className="bg-accent-dim text-accent border border-accent text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              {user?.role === 'admin' ? <><GearSix size={11} /> Administrator</> : <><User size={11} /> Client</>}
            </span>
            <span className="bg-success/10 text-success border border-success/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Check size={11} /> Cont activ
            </span>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/') }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-danger border border-danger/30 hover:bg-danger/10 transition-colors duration-150 text-sm font-semibold bg-transparent cursor-pointer shrink-0">
          <SignOut size={14} /> Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap sticky top-0 z-50 bg-base/[0.97] backdrop-blur-xl py-2.5">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer border-none
            ${activeTab === 'personal'
              ? 'bg-accent text-dark shadow-glow-cyan'
              : 'bg-transparent text-secondary hover:text-primary hover:bg-white/[0.04]'
            }`}
        >
          <User size={14} weight={activeTab === 'personal' ? 'bold' : 'regular'} />
          Date personale
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer border-none
            ${activeTab === 'addresses'
              ? 'bg-accent text-dark shadow-glow-cyan'
              : 'bg-transparent text-secondary hover:text-primary hover:bg-white/[0.04]'
            }`}
        >
          <MapPin size={14} weight={activeTab === 'addresses' ? 'bold' : 'regular'} />
          Adrese ({addresses.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer border-none
            ${activeTab === 'orders'
              ? 'bg-accent text-dark shadow-glow-cyan'
              : 'bg-transparent text-secondary hover:text-primary hover:bg-white/[0.04]'
            }`}
        >
          <Package size={14} weight={activeTab === 'orders' ? 'bold' : 'regular'} />
          Comenzile mele ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('vouchers')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer border-none
            ${activeTab === 'vouchers'
              ? 'bg-accent text-dark shadow-glow-cyan'
              : 'bg-transparent text-secondary hover:text-primary hover:bg-white/[0.04]'
            }`}
        >
          <Tag size={14} weight={activeTab === 'vouchers' ? 'bold' : 'regular'} />
          Vouchere
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer border-none
            ${activeTab === 'wishlist'
              ? 'bg-accent text-dark shadow-glow-cyan'
              : 'bg-transparent text-secondary hover:text-primary hover:bg-white/[0.04]'
            }`}
        >
          <Heart size={14} weight={activeTab === 'wishlist' ? 'bold' : 'regular'} />
          Wishlist ({wishlist.length})
        </button>
        <button
          onClick={() => setActiveTab('warranties')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer border-none
            ${activeTab === 'warranties'
              ? 'bg-accent text-dark shadow-glow-cyan'
              : 'bg-transparent text-secondary hover:text-primary hover:bg-white/[0.04]'
            }`}
        >
          <ShieldCheck size={14} weight={activeTab === 'warranties' ? 'bold' : 'regular'} />
          Garantiile mele
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer border-none
            ${activeTab === 'returns'
              ? 'bg-accent text-dark shadow-glow-cyan'
              : 'bg-transparent text-secondary hover:text-primary hover:bg-white/[0.04]'
            }`}
        >
          <ArrowCounterClockwise size={14} weight={activeTab === 'returns' ? 'bold' : 'regular'} />
          Retururile mele
        </button>
        <button
          onClick={() => setActiveTab('service')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer border-none
            ${activeTab === 'service'
              ? 'bg-accent text-dark shadow-glow-cyan'
              : 'bg-transparent text-secondary hover:text-primary hover:bg-white/[0.04]'
            }`}
        >
          <Wrench size={14} weight={activeTab === 'service' ? 'bold' : 'regular'} />
          Service
        </button>
      </div>

      {message && (
        messageType === 'ok' ? (
          <div className="bg-success/10 border border-success/30 text-success rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-2">
            <Check size={14} /> {message}
          </div>
        ) : (
          <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 mb-4 text-sm flex items-center gap-2">
            <Warning size={14} /> {message}
          </div>
        )
      )}

      {/* DATE PERSONALE */}
      {activeTab === 'personal' && (
        <div className="bg-surface border border-default rounded-2xl p-6">
          <h2 className="text-primary font-display font-bold text-lg mb-5 flex items-center gap-2">
            <User size={18} className="text-accent" />
            Date personale
          </h2>
          <div className="flex flex-col gap-2.5 mb-6">
            {[
              { label: 'Nume complet', value: user?.name, Icon: User },
              { label: 'Rol', value: user?.role === 'admin' ? 'Administrator' : 'Client', Icon: ShieldCheck },
              { label: 'ID Cont', value: user?.id?.slice(0, 8) + '...', Icon: Tag },
              { label: 'Adrese salvate', value: `${addresses.length} adrese`, Icon: MapPin },
              { label: 'Wishlist', value: `${wishlist.length} produse`, Icon: Heart },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center bg-base-2/50 rounded-lg px-4 py-3 border border-default">
                <div className="flex items-center gap-2.5">
                  <item.Icon size={15} className="text-accent" />
                  <span className="text-muted text-sm">{item.label}</span>
                </div>
                <span className="text-primary font-semibold text-sm">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-subtle pt-5">
            <h3 className="text-secondary text-sm font-semibold mb-3">Actiuni rapide</h3>
            <div className="flex gap-2.5 flex-wrap">
              {[
                { label: 'Catalog', path: '/' },
                { label: 'PC Builder', path: '/builder' },
                { label: 'Cos', path: '/cart' },
                { label: 'Comenzi', path: '/orders' },
              ].map(btn => (
                <button key={btn.path} onClick={() => navigate(btn.path)} className="btn-outline text-sm px-3 py-1.5">
                  {btn.label}
                </button>
              ))}
              {(() => {
                const panelCfg = {
                  admin:     { label: 'Panou Admin',     section: 'dashboard', cls: 'text-price border-price-border hover:bg-price-dim' },
                  manager:   { label: 'Panou Manager',   section: 'dashboard', cls: 'text-success border-success/30 hover:bg-success/10' },
                  achizitii: { label: 'Panou Achizitii', section: 'products',  cls: 'text-price border-price-border hover:bg-price-dim' },
                  marketing: { label: 'Panou Marketing', section: 'vouchers',  cls: 'text-violet border-violet/30 hover:bg-violet/10' },
                  suport:    { label: 'Panou Suport',    section: 'orders',    cls: 'text-accent border-accent/30 hover:bg-accent/10' },
                }
                const cfg = panelCfg[user?.role]
                if (!cfg) return null
                return (
                  <button
                    onClick={() => navigate('/admin', { state: { section: cfg.section } })}
                    className={`btn-outline text-sm px-3 py-1.5 ${cfg.cls}`}
                  >
                    {cfg.label}
                  </button>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ADRESE */}
      {activeTab === 'addresses' && (
        <div className="bg-surface border border-default rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-primary font-display font-bold text-lg flex items-center gap-2">
              <MapPin size={18} className="text-accent" />
              Adresele mele
            </h2>
            <button onClick={() => setShowAddForm(!showAddForm)} className={showAddForm ? 'btn-outline' : 'btn-primary'}>
              {showAddForm ? 'Anuleaza' : '+ Adresa noua'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddAddress} className="bg-base-2 rounded-xl p-5 border border-default mb-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Label', key: 'label', ph: 'Acasa / Serviciu' },
                  { label: 'Nume complet', key: 'full_name', ph: 'Ion Popescu', req: true },
                  { label: 'Telefon', key: 'phone', ph: '07xx xxx xxx' },
                  { label: 'Judet', key: 'county', ph: 'Galati', req: true },
                  { label: 'Oras', key: 'city', ph: 'Galati', req: true },
                  { label: 'Cod postal', key: 'postal_code', ph: '800001' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-muted text-xs font-semibold mb-1.5 uppercase tracking-wide">
                      {f.label} {f.req && <span className="text-danger">*</span>}
                    </label>
                    <input
                      value={newAddress[f.key]}
                      onChange={e => setNewAddress({ ...newAddress, [f.key]: e.target.value })}
                      className="input-field"
                      placeholder={f.ph}
                      required={f.req}
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-muted text-xs font-semibold mb-1.5 uppercase tracking-wide">
                    Strada <span className="text-danger">*</span>
                  </label>
                  <input
                    value={newAddress.street}
                    onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="input-field"
                    placeholder="Str. Principala nr. 1"
                    required
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={newAddress.is_default}
                    onChange={e => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                    style={{ accentColor: 'var(--cyan)', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="is_default" className="text-secondary text-sm cursor-pointer">
                    Seteaza ca adresa implicita
                  </label>
                </div>
              </div>
              <button type="submit" className="btn-primary mt-4">
                Salveaza adresa
              </button>
            </form>
          )}

          {addresses.length === 0 ? (
            <div className="text-center py-10">
              <MapPin size={48} weight="duotone" className="ph-duotone text-muted mx-auto mb-3" />
              <p className="text-secondary text-sm mb-4">Nu ai nicio adresa salvata</p>
              <button onClick={() => setShowAddForm(true)} className="btn-primary">
                + Adauga prima adresa
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {addresses.map(addr => (
                <div key={addr.id} className="border border-default rounded-xl p-4 bg-base-2/30 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <MapPin size={14} className="text-accent" />
                      <span className="text-primary font-bold text-sm">{addr.label}</span>
                      {addr.is_default && (
                        <span className="bg-accent-dim text-accent border border-accent text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check size={10} /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-secondary text-sm mb-0.5">{addr.full_name}</p>
                    <p className="text-muted text-xs mb-0.5">{addr.street}, {addr.city}, {addr.county}</p>
                    {addr.phone && (
                      <p className="text-muted text-xs flex items-center gap-1">
                        <Phone size={12} className="text-muted" /> {addr.phone}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="flex items-center gap-1 text-danger border border-danger/30 hover:bg-danger/10 px-3 py-1.5 rounded-lg text-xs font-semibold bg-transparent cursor-pointer transition-colors"
                  >
                    <Trash size={12} /> Sterge
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMENZILE MELE */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-primary font-display font-bold text-lg flex items-center gap-2">
              <Package size={20} weight="bold" className="text-accent" />
              Comenzile mele
            </h2>
            <button onClick={() => navigate('/cart')} className="btn-primary flex items-center gap-2 text-sm">
              <ShoppingCart size={14} weight="bold" />
              Comanda noua
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="bg-surface border border-default rounded-2xl py-16 text-center">
              <Package size={56} weight="duotone" className="ph-duotone text-muted mx-auto mb-4" />
              <p className="text-muted text-lg mb-5">Nu ai nicio comanda inca</p>
              <button onClick={() => navigate('/')} className="btn-primary">Mergi la catalog</button>
            </div>
          ) : (
            orders.map(order => {
              const sc = profileStatusConfig[order.status] || profileStatusConfig.pending
              const isExpanded = expandedId === order.id
              const detail = orderDetails[order.id]
              return (
                <div
                  key={order.id}
                  className={`bg-surface border rounded-xl overflow-hidden shadow-card transition-colors ${isExpanded ? 'border-accent/25' : 'border-default'}`}
                >
                  {/* Header comanda */}
                  <div onClick={() => toggleExpand(order.id)} className="p-5 cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-primary font-bold text-[15px] mb-0.5">
                          Comanda #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-muted text-xs">
                          {new Date(order.created_at).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })}
                          {order.invoice_number && <span className="ml-2">• {order.invoice_number}</span>}
                        </p>
                      </div>
                      <span className={`text-xs px-3.5 py-1 rounded-full font-semibold ${sc.className}`}>
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-default/40 pt-3">
                      <div className="flex gap-2.5 items-center flex-wrap">
                        <span className="text-muted text-[13px]">
                          {order.items_count} {order.items_count === 1 ? 'produs' : 'produse'}
                        </span>
                        <ProfilePayBadge status={order.payment_status} />
                        <button
                          onClick={e => openInvoice(e, order.id)}
                          disabled={loadingInvoice === order.id}
                          className="bg-base-2 border border-default text-secondary text-xs px-2.5 py-1 rounded-lg cursor-pointer hover:border-accent/40 hover:text-accent transition-colors flex items-center gap-1">
                          {loadingInvoice === order.id
                            ? <CircleNotch size={11} className="animate-spin" />
                            : <Receipt size={13} />
                          }
                          Factura
                        </button>
                      </div>
                      <div className="flex gap-3 items-center">
                        <span className="font-mono font-extrabold text-xl text-price">{order.total_price} RON</span>
                        <CaretDown size={16} className={`text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {/* Detalii expandate */}
                  {isExpanded && (
                    <div className="bg-base-2/50 border-t border-default p-5">
                      {loadingDetail === order.id ? (
                        <div className="flex items-center justify-center py-3">
                          <CircleNotch size={20} className="animate-spin text-accent" />
                        </div>
                      ) : detail ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-muted text-[11px] uppercase tracking-wider mb-2.5">Produse</p>
                            <div className="flex flex-col gap-2">
                              {detail.items.map((item, i) => (
                                <div key={i} className="bg-base-2 rounded-lg p-2.5 flex items-center gap-3">
                                  <div className="product-img-bg w-12 h-12 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
                                    {item.image_url
                                      ? <img src={imgUrl(item.image_url)} alt={item.product_name} />
                                      : <Desktop size={20} className="text-muted/40" />
                                    }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-primary text-[13px] font-medium truncate">{item.product_name}</p>
                                    <p className="text-muted text-[11px]">{item.unit_price} RON × {item.quantity}</p>
                                  </div>
                                  <span className="text-price font-bold text-sm shrink-0">{item.subtotal} RON</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-3">
                            {detail.shipping_address && (
                              <div>
                                <p className="text-muted text-[11px] uppercase tracking-wider mb-2">Adresa livrare</p>
                                <div className="bg-surface rounded-lg p-3">
                                  <p className="text-primary text-[13px] font-medium mb-0.5">{detail.shipping_address.full_name}</p>
                                  <p className="text-secondary text-xs">{detail.shipping_address.street}, {detail.shipping_address.city}</p>
                                  <p className="text-muted text-xs">{detail.shipping_address.county} {detail.shipping_address.postal_code}</p>
                                  <p className="text-muted text-xs">{detail.shipping_address.phone}</p>
                                </div>
                              </div>
                            )}
                            <div className="bg-surface rounded-lg p-3">
                              <ProfileTotRow label="Subtotal" value={`${detail.subtotal} RON`} />
                              <ProfileTotRow label="Transport" value={detail.shipping_cost === 0 ? 'Gratuit' : `${detail.shipping_cost} RON`} green={detail.shipping_cost === 0} />
                              {detail.cod_fee > 0 && <ProfileTotRow label="Taxa ramburs" value={`${detail.cod_fee} RON`} amber />}
                              <div className="border-t border-default/40 pt-1.5 mt-1">
                                <ProfileTotRow label="Total" value={`${detail.total_price} RON`} bold />
                              </div>
                            </div>
                            {detail.tracking_number && (
                              <div className="bg-price-dim border border-price-border text-price rounded-lg px-3 py-2 flex items-center gap-2">
                                <Truck size={14} />
                                <span className="text-xs">AWB: <strong>{detail.tracking_number}</strong></span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* VOUCHERE */}
      {activeTab === 'vouchers' && (
        <div className="flex flex-col gap-4">
          {/* Adauga voucher */}
          <div className="bg-surface border border-default rounded-2xl p-5">
            <h3 className="text-primary text-sm font-bold mb-3 flex items-center gap-1.5">
              <Tag size={16} className="text-accent" />
              Adauga voucher
            </h3>
            <div className="flex gap-2 max-w-md">
              <input
                value={voucherCode}
                onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherMsg({ type: '', text: '' }) }}
                onKeyDown={e => e.key === 'Enter' && handleClaimVoucher()}
                placeholder="Ex: ALEX10"
                className="input-field flex-1"
              />
              <button
                onClick={handleClaimVoucher}
                disabled={voucherLoading || !voucherCode.trim()}
                className="btn-primary"
                style={{ opacity: voucherLoading || !voucherCode.trim() ? 0.6 : 1 }}
              >
                {voucherLoading ? '...' : 'Aplica'}
              </button>
            </div>
            {voucherMsg.text && (
              <p className={`text-sm mt-2 flex items-center gap-1 ${voucherMsg.type === 'ok' ? 'text-success' : 'text-danger'}`}>
                {voucherMsg.type === 'ok' ? <Check size={12} /> : <Warning size={12} />}
                {voucherMsg.text}
              </p>
            )}
          </div>

          {/* Lista vouchere */}
          <div className="bg-surface border border-default rounded-2xl p-5">
            <h3 className="text-primary text-sm font-bold mb-4 flex items-center gap-1.5">
              <Tag size={16} className="text-accent" />
              Voucherele mele ({vouchers.length})
            </h3>
            {vouchers.length === 0 ? (
              <p className="text-muted text-sm text-center py-6">Nu ai niciun voucher activ momentan.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {vouchers.map(v => {
                  const expired = v.expires_at && new Date(v.expires_at) < new Date()
                  const exhausted = v.usage_limit != null && v.used_count >= v.usage_limit
                  const inactive = !v.is_active || expired || exhausted
                  return (
                    <div key={v.id} className={inactive
                      ? 'flex justify-between items-center p-4 rounded-xl bg-base-2 border border-default opacity-50'
                      : 'flex justify-between items-center p-4 rounded-xl bg-accent-dim border border-accent'
                    }>
                      <div className="flex gap-3.5 items-center">
                        {v.type === 'free_shipping'
                          ? <Truck size={22} weight="duotone" className="ph-duotone text-accent" />
                          : <Tag size={22} weight="duotone" className="ph-duotone text-accent" />
                        }
                        <div>
                          <div className="flex gap-2 items-center mb-0.5">
                            <span className="text-primary font-bold text-sm font-mono tracking-wider">{v.code}</span>
                            {inactive && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-danger/10 text-danger border border-danger/30">
                                {expired ? 'Expirat' : exhausted ? 'Epuizat' : 'Inactiv'}
                              </span>
                            )}
                          </div>
                          <p className="text-secondary text-xs">
                            {v.type === 'percent' && `${v.value}% reducere`}
                            {v.type === 'fixed' && `${v.value} RON reducere`}
                            {v.type === 'free_shipping' && 'Transport gratuit'}
                            {v.min_order_amount ? ` • min. ${v.min_order_amount} RON` : ''}
                            {v.category_name ? ` • doar ${v.category_name}` : ''}
                          </p>
                          {v.description && <p className="text-muted text-[11px] mt-0.5">{v.description}</p>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {v.expires_at && (
                          <p className="text-muted text-[11px]">Expira: {new Date(v.expires_at).toLocaleDateString('ro-RO')}</p>
                        )}
                        {v.usage_limit != null && (
                          <p className="text-muted text-[11px]">{v.used_count}/{v.usage_limit} utilizari</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WISHLIST */}
      {activeTab === 'wishlist' && (
        <div className="bg-surface border border-default rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-primary font-display font-bold text-lg flex items-center gap-2">
              <Heart size={18} className="text-accent" />
              Wishlist-ul meu
            </h2>
            <span className="text-muted text-sm">
              {wishlist.length} {wishlist.length === 1 ? 'produs' : 'produse'}
            </span>
          </div>

          {wishlist.length === 0 ? (
            <div className="text-center py-10">
              <Heart size={48} weight="duotone" className="ph-duotone text-muted mx-auto mb-3" />
              <p className="text-secondary text-sm mb-4">Nu ai niciun produs in wishlist</p>
              <button onClick={() => navigate('/')} className="btn-primary">
                Exploreaza catalogul →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {wishlist.map(item => (
                <div key={item.wishlist_id} className="flex items-center gap-3.5 bg-base-2/30 rounded-xl p-3.5 border border-default">
                  <Link to={`/product/${item.product_id}`} className="no-underline shrink-0">
                    <div className="product-img-bg w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                      {item.image_url
                        ? <img src={imgUrl(item.image_url)} alt={item.name} />
                        : <Desktop size={22} className="text-muted/50" />
                      }
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.product_id}`} className="no-underline">
                      <p className="text-primary text-sm font-semibold mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.name}
                      </p>
                    </Link>
                    <p className="text-muted text-xs mb-1">{item.brand} · {item.category}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-price font-mono font-bold text-sm">{item.price} RON</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.stock > 0 ? 'bg-success/10 text-success border border-success/30' : 'bg-danger/10 text-danger border border-danger/30'}`}>
                        {item.stock > 0 ? 'În stoc' : 'Epuizat'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAddToCart(item.product_id)}
                      disabled={addingToCart === item.product_id || item.stock === 0}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                      style={{ opacity: item.stock === 0 ? 0.5 : 1, cursor: item.stock === 0 ? 'not-allowed' : undefined }}
                    >
                      {addingToCart === item.product_id
                        ? <CircleNotch size={13} className="animate-spin" />
                        : <ShoppingCart size={13} />
                      }
                      Adauga
                    </button>
                    <button
                      onClick={() => handleRemoveWishlist(item.product_id)}
                      className="p-1.5 text-danger border border-danger/30 hover:bg-danger/10 rounded-lg transition-colors bg-transparent cursor-pointer"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GARANTIILE MELE */}
      {activeTab === 'warranties' && (
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="bg-surface border border-accent/15 rounded-2xl px-6 py-5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-accent-dim border border-accent flex items-center justify-center">
                <ShieldCheck size={22} weight="bold" className="text-accent" />
              </div>
              <div>
                <h2 className="text-primary font-display font-bold text-lg m-0">Garantiile mele</h2>
                <p className="text-muted text-xs m-0">
                  {orders.reduce((acc, o) => acc + (o.items?.length || 0), 0)} produse · garantie activa per produs
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <a href="mailto:support@alexcomputers.ro" className="bg-accent-dim border border-accent text-accent px-3.5 py-1.5 rounded-lg text-xs font-semibold no-underline hover:text-dark hover:bg-accent transition-colors">
                Support
              </a>
              <a href="tel:0800123456" className="btn-primary text-xs px-3.5 py-1.5 no-underline">
                0800 123 456
              </a>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="bg-surface/50 border border-default rounded-2xl py-16 px-6 text-center">
              <ShieldCheck size={52} weight="duotone" className="ph-duotone text-muted/20 mx-auto mb-3" />
              <p className="text-secondary text-sm mb-1.5">Nicio garantie activa</p>
              <p className="text-muted text-xs mb-5">Garantiile apar automat dupa plasarea primei comenzi</p>
              <button onClick={() => navigate('/')} className="btn-primary">Mergi la catalog →</button>
            </div>
          ) : (
            orders.map(order => {
              const orderDate = new Date(order.created_at)
              const now = new Date()
              return (
                <div key={order.id} className="bg-surface/50 border border-default rounded-2xl overflow-hidden">
                  {/* Order header */}
                  <div className="bg-base-2 px-5 py-3.5 border-b border-default flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <Package size={14} className="text-muted" />
                      <div>
                        <span className="text-muted text-xs">Comanda </span>
                        <span className="text-accent font-bold text-sm font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <span className="bg-base-2 border border-default text-muted text-[11px] px-2 py-0.5 rounded-md">
                        {order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'produs' : 'produse'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-muted text-[11px] m-0">Data comenzii</p>
                        <p className="text-secondary text-xs font-semibold m-0">
                          {orderDate.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted text-[11px] m-0">Total comanda</p>
                        <p className="text-accent text-xs font-bold m-0">{order.total_price?.toLocaleString('ro-RO')} RON</p>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="p-3 flex flex-col gap-2.5">
                    {(order.items || []).map((item, idx) => {
                      const months = item.warranty_months || 24
                      const expiry = new Date(orderDate)
                      expiry.setMonth(expiry.getMonth() + months)
                      const msLeft = expiry - now
                      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
                      const totalMs = expiry - orderDate
                      const pct = Math.max(0, Math.min(100, (msLeft / totalMs) * 100))
                      const color = daysLeft > 180 ? '#00E676' : daysLeft > 60 ? '#FFB300' : daysLeft > 0 ? '#FF7043' : '#FF5252'
                      const statusLabel = daysLeft > 0 ? 'Activa' : 'Expirata'
                      const timeLeftLabel = daysLeft > 0 ? `${daysLeft} zile` : 'Expirata'

                      return (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '14px 16px', border: `1px solid ${color}18`, display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                          {/* Image */}
                          <div className="product-img-bg w-14 h-14 rounded-xl shrink-0 overflow-hidden flex items-center justify-center">
                            {item.image_url
                              ? <img src={imgUrl(item.image_url)} alt={item.product_name} />
                              : <Desktop size={22} className="text-muted/30" />
                            }
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2.5 mb-2">
                              <div className="min-w-0">
                                <p className="text-primary font-bold text-sm m-0 mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
                                  {item.product_name}
                                </p>
                                {item.brand && <p className="text-muted text-xs m-0">{item.brand}</p>}
                              </div>
                              <span style={{ background: `${color}18`, border: `1px solid ${color}45`, color, fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                {statusLabel}
                              </span>
                            </div>

                            {/* Dates row */}
                            <div className="grid grid-cols-3 gap-2 mb-2.5">
                              <div className="bg-base-2/50 rounded-lg px-2.5 py-2">
                                <p className="text-muted text-[10px] font-semibold tracking-wide m-0 mb-0.5 uppercase">Data achizitiei</p>
                                <p className="text-secondary text-xs font-semibold m-0">
                                  {orderDate.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </p>
                              </div>
                              <div className="bg-base-2/50 rounded-lg px-2.5 py-2">
                                <p className="text-muted text-[10px] font-semibold tracking-wide m-0 mb-0.5 uppercase">Expira garantia</p>
                                <p style={{ color, fontSize: '12px', fontWeight: '700', margin: 0 }}>
                                  {expiry.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </p>
                              </div>
                              <div className="bg-base-2/50 rounded-lg px-2.5 py-2">
                                <p className="text-muted text-[10px] font-semibold tracking-wide m-0 mb-0.5 uppercase">Timp ramas</p>
                                <p style={{ color, fontSize: '12px', fontWeight: '700', margin: 0 }}>
                                  {timeLeftLabel}
                                </p>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="flex items-center gap-2.5">
                              <div className="flex-1 h-[5px] bg-white/[0.06] rounded-full overflow-hidden">
                                <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                              </div>
                              <span className="text-muted text-[11px] shrink-0">{months} luni</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}

          {/* Footer contact */}
          {orders.length > 0 && (
            <div className="bg-success/[0.04] border border-success/[0.13] rounded-xl px-4 py-3.5 flex justify-between items-center flex-wrap gap-2.5">
              <p className="text-secondary text-sm m-0">
                <Wrench size={13} className="text-success inline mr-1" />
                Produs defect in garantie? <strong className="text-success">Contacteaza-ne</strong> si iti trimitem eticheta de transport gratuita.
              </p>
              <button onClick={() => setActiveTab('service')} className="btn-primary text-sm">
                Solicita service
              </button>
            </div>
          )}
        </div>
      )}

      {/* SERVICE */}
      {activeTab === 'service' && (
        <div className="bg-surface border border-default rounded-2xl p-6">

          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-price-dim border border-price-border flex items-center justify-center">
                <Wrench size={20} weight="bold" className="text-price" />
              </div>
              <div>
                <h2 className="text-primary font-display font-bold text-lg m-0">Service & Reparatii</h2>
                <p className="text-muted text-xs m-0">{serviceRequests.length} {serviceRequests.length === 1 ? 'cerere' : 'cereri'} de service</p>
              </div>
            </div>
            <button
              onClick={() => setShowServiceForm(!showServiceForm)}
              className={showServiceForm ? 'btn-outline text-sm' : 'btn-primary text-sm'}
            >
              {showServiceForm ? 'Anuleaza' : '+ Cerere service'}
            </button>
          </div>

          {/* Pasi */}
          <div className="grid grid-cols-4 gap-2.5 mb-5">
            {[
              { step: '1', Icon: ClipboardText, title: 'Cerere online', desc: 'Completeaza formularul' },
              { step: '2', Icon: Truck, title: 'Ridicare', desc: 'Curierul vine la tine' },
              { step: '3', Icon: Wrench, title: 'Diagnosticare', desc: 'Verificat in 1-2 zile' },
              { step: '4', Icon: Check, title: 'Rezolvat', desc: 'Reparat sau inlocuit' },
            ].map(s => (
              <div key={s.step} className="bg-price-dim/40 border border-price-border/50 rounded-xl p-3 text-center">
                <div className="w-6 h-6 rounded-full bg-price-dim border border-price-border text-price text-[11px] font-extrabold flex items-center justify-center mx-auto mb-2">{s.step}</div>
                <s.Icon size={16} className="text-price mx-auto mb-1" />
                <p className="text-primary font-bold text-[11px] m-0 mb-0.5">{s.title}</p>
                <p className="text-muted text-[10px] m-0">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Formular */}
          {showServiceForm && (
            <form onSubmit={handleServiceSubmit} className="bg-gradient-to-br from-price-dim/[0.3] to-transparent border border-price-border rounded-2xl p-6 mb-6">
              <h3 className="text-price font-bold text-sm flex items-center gap-2 mb-5">
                <Wrench size={14} /> Formular cerere service
              </h3>

              {/* Comanda */}
              <div className="mb-3.5">
                <label className="block text-muted text-[11px] font-semibold mb-1.5 uppercase tracking-wide">COMANDA *</label>
                <select
                  required
                  value={serviceForm.order_id}
                  onChange={e => {
                    const ord = orders.find(o => o.id === e.target.value)
                    const addr = ord?.shipping_address || {}
                    setServiceForm(f => ({
                      ...f,
                      order_id: e.target.value,
                      product_id: '', product_name: '',
                      pickup_address: {
                        full_name:   addr.full_name   || '',
                        phone:       addr.phone       || '',
                        street:      addr.street      || '',
                        city:        addr.city        || '',
                        county:      addr.county      || '',
                        postal_code: addr.postal_code || '',
                      }
                    }))
                  }}
                  className="input-field cursor-pointer"
                >
                  <option value="" style={{ background: '#0A0E1A' }}>Alege comanda...</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id} style={{ background: '#0A0E1A' }}>
                      Comanda #{o.id.slice(0,8).toUpperCase()} — {new Date(o.created_at).toLocaleDateString('ro-RO')} — {o.total_price} RON
                    </option>
                  ))}
                </select>
              </div>

              {/* Produs */}
              {serviceForm.order_id && (() => {
                const items = orders.find(o => o.id === serviceForm.order_id)?.items || []
                return (
                  <div className="mb-3.5">
                    <label className="block text-muted text-[11px] font-semibold mb-1.5 uppercase tracking-wide">PRODUS *</label>
                    <select
                      required
                      value={serviceForm.product_id}
                      onChange={e => {
                        const item = items.find(i => i.product_id === e.target.value)
                        setServiceForm(f => ({ ...f, product_id: e.target.value, product_name: item?.product_name || '' }))
                      }}
                      className="input-field cursor-pointer"
                    >
                      <option value="" style={{ background: '#0A0E1A' }}>Alege produsul...</option>
                      {items.map(item => (
                        <option key={item.product_id} value={item.product_id} style={{ background: '#0A0E1A' }}>
                          {item.product_name} — {item.unit_price} RON
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })()}

              {/* Descriere problema */}
              <div className="mb-4.5">
                <label className="block text-muted text-[11px] font-semibold mb-1.5 uppercase tracking-wide">DESCRIEREA PROBLEMEI *</label>
                <textarea
                  required
                  value={serviceForm.descriere}
                  onChange={e => setServiceForm(f => ({ ...f, descriere: e.target.value }))}
                  rows={4}
                  placeholder="Descrie cat mai detaliat problema: sunete neobisnuite, erori afisate, cand apare problema, ce ai incercat deja..."
                  className="input-field resize-y"
                />
              </div>

              {/* Adresa ridicare */}
              <div className="mb-4.5">
                <div className="flex items-center gap-2 mb-2">
                  <Truck size={14} className="text-price" />
                  <label className="text-muted text-[11px] font-semibold uppercase tracking-wide">ADRESA DE RIDICARE *</label>
                </div>
                <div className="bg-price-dim border border-price-border rounded-lg px-3.5 py-2.5 text-price text-xs mb-2.5 flex items-center gap-1.5">
                  <Truck size={13} /> Curierul vine sa ridice produsul de la adresa ta. Transport gratuit pentru produse in garantie.
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { key: 'full_name', label: 'Nume complet', ph: 'Ion Popescu' },
                    { key: 'phone',    label: 'Telefon',       ph: '07xx xxx xxx' },
                    { key: 'street',   label: 'Strada',        ph: 'Str. Principala nr. 1', full: true },
                    { key: 'city',     label: 'Oras',          ph: 'Galati' },
                    { key: 'county',   label: 'Judet',         ph: 'Galati' },
                    { key: 'postal_code', label: 'Cod postal', ph: '800001' },
                  ].map(f => (
                    <div key={f.key} className={f.full ? 'col-span-2' : ''}>
                      <label className="block text-muted text-[11px] font-semibold mb-1 uppercase tracking-wide">{f.label}</label>
                      <input
                        value={serviceForm.pickup_address[f.key] || ''}
                        onChange={e => setServiceForm(prev => ({ ...prev, pickup_address: { ...prev.pickup_address, [f.key]: e.target.value } }))}
                        className="input-field"
                        placeholder={f.ph}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Date contact */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={14} className="text-accent" />
                  <label className="text-muted text-[11px] font-semibold uppercase tracking-wide">DATE DE CONTACT *</label>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-muted text-[11px] font-semibold mb-1 uppercase tracking-wide">Telefon *</label>
                    <input
                      required
                      value={serviceForm.contact_telefon}
                      onChange={e => setServiceForm(f => ({ ...f, contact_telefon: e.target.value }))}
                      placeholder="07xx xxx xxx"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-muted text-[11px] font-semibold mb-1 uppercase tracking-wide">Email (optional)</label>
                    <input
                      value={serviceForm.contact_email}
                      onChange={e => setServiceForm(f => ({ ...f, contact_email: e.target.value }))}
                      placeholder="email@exemplu.ro"
                      type="email"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-price-dim/50 border border-price-border/50 rounded-xl p-3 mb-5 text-secondary text-xs leading-relaxed">
                • <strong className="text-price">Confirmare:</strong> Primesti email in max 24h cu detalii ridicare<br />
                • <strong className="text-price">In garantie:</strong> Reparatie + transport gratuit<br />
                • <strong className="text-price">In afara garantiei:</strong> Primesti estimare cost inainte de reparatie
              </div>

              <div className="flex gap-2.5">
                <button type="submit" disabled={serviceSubmitting} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2" style={{ opacity: serviceSubmitting ? 0.7 : 1 }}>
                  {serviceSubmitting ? <><CircleNotch className="animate-spin" size={15} /> Se trimite...</> : 'Trimite cererea de service'}
                </button>
                <button type="button" onClick={() => setShowServiceForm(false)} className="btn-outline py-3 px-5">
                  Anuleaza
                </button>
              </div>
            </form>
          )}

          {/* Lista cereri existente */}
          {serviceRequests.length === 0 && !showServiceForm ? (
            <div className="text-center py-12">
              <Wrench size={52} weight="duotone" className="ph-duotone text-muted/20 mx-auto mb-3" />
              <p className="text-secondary text-sm mb-1.5">Nu ai nicio cerere de service</p>
              <p className="text-muted text-xs">Apasa "+ Cerere service" pentru a trimite produsul la reparat</p>
            </div>
          ) : serviceRequests.length > 0 && (
            <div className="flex flex-col gap-2.5 mb-5">
              <p className="text-secondary text-sm font-bold m-0 mb-1">Cereri trimise ({serviceRequests.length})</p>
              {serviceRequests.map(r => {
                const stMap = {
                  in_asteptare: { className: 'bg-price-dim text-price border border-price-border', label: 'În așteptare', color: 'var(--amber)' },
                  in_service:   { className: 'bg-price-dim text-price border border-price-border', label: 'În service',   color: 'var(--amber)' },
                  rezolvat:     { className: 'bg-success/15 text-success border border-success/30', label: 'Rezolvat',    color: 'var(--green)' },
                  respins:      { className: 'bg-danger/15 text-danger border border-danger/30',    label: 'Respins',     color: 'var(--red)' },
                }
                const st = stMap[r.status] || stMap.in_asteptare
                return (
                  <div key={r.id} className="bg-base-2/30 border border-default rounded-2xl px-4 py-4" style={{ borderLeft: `3px solid ${st.color}` }}>
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <p className="text-primary font-bold text-sm m-0">{r.product_name}</p>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${st.className}`}>
                            {st.label}
                          </span>
                          {r.nr_ticket && (
                            <span className="bg-accent-dim text-accent border border-accent text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                              #{r.nr_ticket}
                            </span>
                          )}
                        </div>
                        <p className="text-muted text-xs m-0 mb-0.5">Comanda #{r.order_id.slice(0,8).toUpperCase()}</p>
                        <p className="text-muted text-xs m-0 mb-0.5">
                          Problema: <span className="text-secondary">{r.descriere.slice(0,80)}{r.descriere.length > 80 ? '...' : ''}</span>
                        </p>
                        <p className="text-muted text-xs m-0">
                          Contact: <span className="text-secondary">{r.contact_telefon}</span>
                          {r.contact_email && <span className="text-muted"> · {r.contact_email}</span>}
                        </p>
                      </div>
                      <p className="text-muted text-[11px] m-0 whitespace-nowrap shrink-0">
                        {new Date(r.created_at).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer contact */}
          <div className="bg-price-dim/[0.4] border border-price-border rounded-xl px-4 py-3.5 flex justify-between items-center flex-wrap gap-2.5">
            <div>
              <p className="text-price font-bold text-sm m-0 mb-0.5 flex items-center gap-1.5">
                <Phone size={13} className="text-price" /> Preferi sa ne suni direct?
              </p>
              <p className="text-muted text-xs m-0">Luni – Vineri, 09:00 – 18:00</p>
            </div>
            <div className="flex gap-2">
              <a href="mailto:aa387@student.ugal.ro" className="bg-price-dim border border-price-border text-price px-3 py-1.5 rounded-lg text-xs font-semibold no-underline flex items-center gap-1.5">
                <EnvelopeSimple size={12} /> aa387@student.ugal.ro
              </a>
              <a href="tel:0770648476" className="btn-primary text-xs no-underline flex items-center gap-1.5">
                <Phone size={12} /> 0770 648 476
              </a>
            </div>
          </div>
        </div>
      )}

      {/* RETURURILE MELE */}
      {activeTab === 'returns' && (
        <div className="bg-surface border border-default rounded-2xl p-6">

          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet/15 border border-violet/30 flex items-center justify-center">
                <ArrowCounterClockwise size={20} weight="bold" className="text-violet" />
              </div>
              <div>
                <h2 className="text-primary font-display font-bold text-lg m-0">Retururile mele</h2>
                <p className="text-muted text-xs m-0">{retururi.length} {retururi.length === 1 ? 'cerere' : 'cereri'} de retur</p>
              </div>
            </div>
            <button
              onClick={() => setShowReturForm(!showReturForm)}
              className={showReturForm ? 'btn-outline text-sm' : 'btn-primary text-sm'}
            >
              {showReturForm ? 'Anuleaza' : '+ Cerere de retur'}
            </button>
          </div>

          {/* Politica */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {[
              { Icon: CalendarBlank, title: '30 zile', desc: 'Drept de retur de la livrare', color: '#42A5F5' },
              { Icon: Package,       title: 'Sigilat', desc: 'Rambursare 100%, fara taxe',   color: '#00E676' },
              { Icon: CreditCard,    title: '5-7 zile', desc: 'Rambursare in cont bancar',   color: '#CE93D8' },
            ].map((c, i) => (
              <div key={i} style={{ background: `${c.color}08`, border: `1px solid ${c.color}20`, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <c.Icon size={20} className="mx-auto mb-1.5" style={{ color: c.color }} />
                <p style={{ color: c.color, fontWeight: '800', fontSize: '16px', margin: '0 0 3px' }}>{c.title}</p>
                <p className="text-muted text-[11px] m-0">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* Formular cerere retur */}
          {showReturForm && (
            <form onSubmit={handleReturSubmit} className="bg-gradient-to-br from-violet/[0.05] to-transparent border border-violet/25 rounded-2xl p-6 mb-6">
              <h3 className="text-violet font-bold text-sm flex items-center gap-2 mb-5">
                <ArrowCounterClockwise size={14} /> Formular cerere de retur
              </h3>

              {/* Selectie comanda */}
              <div className="mb-3.5">
                <label className="block text-muted text-[11px] font-semibold mb-1.5 uppercase tracking-wide">COMANDA *</label>
                <select
                  required
                  value={returForm.order_id}
                  onChange={e => {
                    const ord = orders.find(o => o.id === e.target.value)
                    const addr = ord?.shipping_address || {}
                    setReturForm(f => ({
                      ...f,
                      order_id: e.target.value,
                      product_name: '', product_id: '',
                      refund_method: ord?.payment_method_type === 'card' ? 'card' : 'iban',
                      pickup_address: {
                        full_name:   addr.full_name   || '',
                        phone:       addr.phone       || '',
                        street:      addr.street      || '',
                        city:        addr.city        || '',
                        county:      addr.county      || '',
                        postal_code: addr.postal_code || '',
                      }
                    }))
                  }}
                  className="input-field cursor-pointer"
                >
                  <option value="" style={{ background: '#0A0E1A' }}>Alege comanda...</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id} style={{ background: '#0A0E1A' }}>
                      Comanda #{o.id.slice(0, 8).toUpperCase()} — {new Date(o.created_at).toLocaleDateString('ro-RO')} — {o.total_price} RON
                    </option>
                  ))}
                </select>
              </div>

              {/* Selectie produs din comanda */}
              {returForm.order_id && (() => {
                const ord = orders.find(o => o.id === returForm.order_id)
                const items = ord?.items || []
                return (
                  <div className="mb-3.5">
                    <label className="block text-muted text-[11px] font-semibold mb-1.5 uppercase tracking-wide">PRODUS *</label>
                    <select
                      required
                      value={returForm.product_id}
                      onChange={e => {
                        const item = items.find(i => i.product_id === e.target.value)
                        setReturForm(f => ({ ...f, product_id: e.target.value, product_name: item?.product_name || '' }))
                      }}
                      className="input-field cursor-pointer"
                    >
                      <option value="" style={{ background: '#0A0E1A' }}>Alege produsul...</option>
                      {items.map(item => (
                        <option key={item.product_id} value={item.product_id} style={{ background: '#0A0E1A' }}>
                          {item.product_name} — {item.unit_price} RON
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })()}

              {/* Motiv retur */}
              <div className="mb-3.5">
                <label className="block text-muted text-[11px] font-semibold mb-2 uppercase tracking-wide">MOTIV RETUR *</label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { value: 'defect',       label: 'Produs defect / nefuncțional',      desc: 'Nu porneste sau functioneaza incorect' },
                    { value: 'diferit',      label: 'Produs diferit fata de descriere',   desc: 'Specificatii sau aspect diferit' },
                    { value: 'deteriorat',   label: 'Produs deteriorat la livrare',        desc: 'Ambalaj sau produs avariat' },
                    { value: 'incompatibil', label: 'Incompatibil cu sistemul meu',        desc: 'Nu se potriveste cu celelalte componente' },
                    { value: 'renuntat',     label: 'Am renuntat la comanda',              desc: 'Nu mai am nevoie de produs' },
                    { value: 'altul',        label: 'Alt motiv',                           desc: 'Specifica motivul mai jos' },
                  ].map(opt => (
                    <label key={opt.value} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      background: returForm.motiv === opt.value ? 'rgba(206,147,216,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${returForm.motiv === opt.value ? 'rgba(206,147,216,0.4)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '10px', padding: '10px 14px', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>
                      <input
                        type="radio" name="motiv" value={opt.value}
                        checked={returForm.motiv === opt.value}
                        onChange={e => setReturForm(f => ({ ...f, motiv: e.target.value, motiv_detalii: '' }))}
                        style={{ accentColor: '#CE93D8', marginTop: '2px', flexShrink: 0 }}
                        required
                      />
                      <div>
                        <p className="text-primary text-sm font-semibold m-0 mb-0.5">{opt.label}</p>
                        <p className="text-muted text-[11px] m-0">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Detalii alt motiv */}
              {returForm.motiv === 'altul' && (
                <div className="mb-3.5">
                  <label className="block text-muted text-[11px] font-semibold mb-1.5 uppercase tracking-wide">DESCRIE MOTIVUL *</label>
                  <textarea
                    required
                    value={returForm.motiv_detalii}
                    onChange={e => setReturForm(f => ({ ...f, motiv_detalii: e.target.value }))}
                    rows={3} placeholder="Descrie pe scurt motivul returului..."
                    className="input-field resize-y"
                  />
                </div>
              )}

              {/* Stare produs */}
              <div className="mb-5">
                <label className="block text-muted text-[11px] font-semibold mb-2 uppercase tracking-wide">STAREA PRODUSULUI *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'sigilat',       label: 'Sigilat',      desc: 'Ambalaj intact, neutilizat', color: '#00E676' },
                    { value: 'functional',    label: 'Funcțional',   desc: 'Utilizat, dar functioneaza', color: '#42A5F5' },
                    { value: 'nefunctional',  label: 'Nefuncțional', desc: 'Nu functioneaza corect',     color: '#FF5252' },
                  ].map(opt => (
                    <label key={opt.value} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                      background: returForm.stare_produs === opt.value ? `${opt.color}12` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${returForm.stare_produs === opt.value ? opt.color + '50' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '10px', padding: '14px 10px', cursor: 'pointer',
                      textAlign: 'center', transition: 'all 0.15s',
                    }}>
                      <input
                        type="radio" name="stare" value={opt.value}
                        checked={returForm.stare_produs === opt.value}
                        onChange={e => setReturForm(f => ({ ...f, stare_produs: e.target.value }))}
                        style={{ accentColor: opt.color }} required
                      />
                      <p style={{ color: returForm.stare_produs === opt.value ? opt.color : undefined, fontSize: '13px', fontWeight: '700', margin: '4px 0 2px' }} className={returForm.stare_produs !== opt.value ? 'text-primary' : ''}>{opt.label}</p>
                      <p className="text-muted text-[10px] m-0 leading-tight">{opt.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Adresa ridicare curier */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <Truck size={14} className="text-accent" />
                  <label className="text-muted text-[11px] font-semibold uppercase tracking-wide">
                    ADRESA DE RIDICARE (curierul vine la tine)
                  </label>
                </div>
                <div className="bg-accent-dim border border-accent rounded-lg px-3.5 py-2.5 mb-2.5 text-accent text-xs flex items-center gap-1.5">
                  <Check size={13} /> Curierul va prelua produsul direct de la adresa indicata. Eticheta de retur este gratuita.
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { key: 'full_name', label: 'Nume complet', ph: 'Ion Popescu' },
                    { key: 'phone',    label: 'Telefon',       ph: '07xx xxx xxx' },
                    { key: 'street',   label: 'Strada',        ph: 'Str. Principala nr. 1', full: true },
                    { key: 'city',     label: 'Oras',          ph: 'Galati' },
                    { key: 'county',   label: 'Judet',         ph: 'Galati' },
                    { key: 'postal_code', label: 'Cod postal', ph: '800001' },
                  ].map(f => (
                    <div key={f.key} className={f.full ? 'col-span-2' : ''}>
                      <label className="block text-muted text-[11px] font-semibold mb-1 uppercase tracking-wide">{f.label}</label>
                      <input
                        value={returForm.pickup_address[f.key] || ''}
                        onChange={e => setReturForm(prev => ({ ...prev, pickup_address: { ...prev.pickup_address, [f.key]: e.target.value } }))}
                        className="input-field"
                        placeholder={f.ph}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Metoda rambursare */}
              {(() => {
                const ord = orders.find(o => o.id === returForm.order_id)
                const isPaidByCard = ord?.payment_method_type === 'card'
                return (
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <CreditCard size={14} className="text-accent" />
                      <label className="text-muted text-[11px] font-semibold uppercase tracking-wide">RAMBURSARE BANI</label>
                    </div>
                    {isPaidByCard ? (
                      <div className="bg-success/[0.06] border border-success/20 rounded-xl p-4 flex items-center gap-3">
                        <CreditCard size={22} className="text-success shrink-0" />
                        <div>
                          <p className="text-success font-bold text-sm m-0 mb-0.5">Rambursare automata pe card</p>
                          <p className="text-muted text-xs m-0">Suma va fi returnata pe cardul cu care ai platit, dupa preluarea si verificarea produsului (5–7 zile lucratoare).</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="bg-price-dim border border-price-border rounded-xl p-3 mb-3 text-price text-xs flex items-start gap-1.5">
                          <Warning size={13} className="shrink-0 mt-0.5" />
                          <span>Comanda a fost platita prin <strong>{ord?.payment_method_type === 'cod' ? 'ramburs (cash)' : 'transfer bancar'}</strong>. Te rugam sa completezi contul bancar pentru rambursare.</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="col-span-2">
                            <label className="block text-muted text-[11px] font-semibold mb-1 uppercase tracking-wide">IBAN *</label>
                            <input
                              required={!isPaidByCard}
                              value={returForm.iban}
                              onChange={e => setReturForm(f => ({ ...f, iban: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                              placeholder="RO49AAAA1B31007593840000"
                              className="input-field"
                              style={{ letterSpacing: '1px' }}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-muted text-[11px] font-semibold mb-1 uppercase tracking-wide">TITULAR CONT *</label>
                            <input
                              required={!isPaidByCard}
                              value={returForm.titular_cont}
                              onChange={e => setReturForm(f => ({ ...f, titular_cont: e.target.value }))}
                              placeholder="Ion Popescu"
                              className="input-field"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Info procesare */}
                    <div className="bg-violet/[0.05] border border-violet/15 rounded-xl p-3.5 mt-3 flex gap-2.5">
                      <MagnifyingGlass size={16} className="text-violet shrink-0 mt-0.5" />
                      <p className="text-secondary text-xs leading-relaxed m-0">
                        <strong className="text-violet">Procesare retur:</strong> Dupa ce curierul preia produsul, echipa noastra il va verifica in <strong className="text-primary">1–2 zile lucratoare</strong>. Rambursarea se efectueaza in maxim <strong className="text-primary">5–7 zile lucratoare</strong> de la confirmarea verificarii.
                      </p>
                    </div>
                  </div>
                )
              })()}

              {/* Butoane */}
              <div className="flex gap-2.5">
                <button type="submit" disabled={returSubmitting} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2" style={{ opacity: returSubmitting ? 0.7 : 1 }}>
                  {returSubmitting ? <><CircleNotch className="animate-spin" size={15} /> Se trimite...</> : 'Trimite cererea de retur'}
                </button>
                <button type="button" onClick={() => setShowReturForm(false)} className="btn-outline py-3 px-5">
                  Anuleaza
                </button>
              </div>
            </form>
          )}

          {/* Lista retururi existente */}
          {retururi.length === 0 && !showReturForm ? (
            <div className="text-center py-12">
              <ArrowCounterClockwise size={52} weight="duotone" className="ph-duotone text-muted/20 mx-auto mb-3" />
              <p className="text-secondary text-sm mb-1.5">Nu ai nicio cerere de retur</p>
              <p className="text-muted text-xs mb-6">Apasa "+ Cerere de retur" pentru a initia un retur</p>
            </div>
          ) : retururi.length > 0 && (
            <div className="flex flex-col gap-2.5 mb-5">
              <p className="text-secondary text-sm font-bold m-0 mb-1">Cereri trimise ({retururi.length})</p>
              {retururi.map(r => {
                const statusMap = {
                  in_asteptare: { className: 'bg-price-dim text-price border border-price-border',        label: 'În așteptare', color: 'var(--amber)' },
                  aprobat:      { className: 'bg-success/15 text-success border border-success/30',       label: 'Aprobat',      color: 'var(--green)' },
                  respins:      { className: 'bg-danger/15 text-danger border border-danger/30',          label: 'Respins',      color: 'var(--red)'   },
                  finalizat:    { className: 'bg-accent-dim text-accent border border-accent',            label: 'Finalizat',    color: 'var(--cyan)'  },
                }
                const st = statusMap[r.status] || statusMap.in_asteptare
                const motivMap = {
                  defect: 'Produs defect', diferit: 'Diferit fata de descriere',
                  deteriorat: 'Deteriorat la livrare', incompatibil: 'Incompatibil',
                  renuntat: 'Am renuntat', altul: 'Alt motiv',
                }
                return (
                  <div key={r.id} className="bg-base-2/30 border border-default rounded-2xl px-4 py-4" style={{ borderLeft: `3px solid ${st.color}` }}>
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="product-img-bg w-12 h-12 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
                          {r.image_url
                            ? <img src={imgUrl(r.image_url)} alt={r.product_name} />
                            : <Desktop size={18} className="text-muted/40" />
                          }
                        </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-primary font-bold text-sm m-0">{r.product_name}</p>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${st.className}`}>
                            {st.label}
                          </span>
                        </div>
                        <p className="text-muted text-xs m-0 mb-0.5">Comanda #{r.order_id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-muted text-xs m-0 mb-0.5">
                          Motiv: <span className="text-secondary">{motivMap[r.motiv] || r.motiv}</span>
                          {r.motiv_detalii && ` — ${r.motiv_detalii}`}
                        </p>
                        <p className="text-muted text-xs m-0">
                          Stare produs: <span className="text-secondary capitalize">{r.stare_produs}</span>
                        </p>
                      </div>
                      </div>
                      <p className="text-muted text-[11px] m-0 whitespace-nowrap shrink-0">
                        {new Date(r.created_at).toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer contact */}
          <div className="bg-violet/[0.04] border border-violet/15 rounded-xl px-4 py-3.5 flex justify-between items-center flex-wrap gap-2.5">
            <p className="text-secondary text-xs m-0 flex items-center gap-1.5">
              <EnvelopeSimple size={14} className="text-violet" /> Ai intrebari despre retur? Contacteaza-ne direct.
            </p>
            <div className="flex gap-2">
              <a href="mailto:retururi@alexcomputers.ro" className="bg-violet/10 border border-violet/30 text-violet px-3 py-1.5 rounded-lg text-xs font-semibold no-underline flex items-center gap-1.5">
                <EnvelopeSimple size={12} /> Email
              </a>
              <a href="tel:0800123456" className="btn-primary text-xs no-underline flex items-center gap-1.5">
                <Phone size={12} /> 0800 123 456
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal factura comenzi */}
      {invoiceOrder && (
        <ProfileInvoiceModal invoice={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}
    </div>
  )
}

// Config statusuri comenzi
const profileStatusConfig = {
  pending:    { className: 'bg-price-dim text-price border border-price-border',       label: 'In asteptare' },
  confirmed:  { className: 'bg-accent-dim text-accent border border-accent',           label: 'Confirmat' },
  processing: { className: 'bg-violet/15 text-violet border border-violet/30',         label: 'In procesare' },
  shipped:    { className: 'bg-price-dim text-price border border-price-border',       label: 'Expediat' },
  delivered:  { className: 'bg-success/15 text-success border border-success/30',      label: 'Livrat' },
  cancelled:  { className: 'bg-danger/15 text-danger border border-danger/30',         label: 'Anulat' },
}

// Badge plata pentru tab comenzi
function ProfilePayBadge({ status }) {
  const map = {
    paid:             { className: 'bg-success/15 text-success border border-success/30',       text: 'Platit' },
    cod:              { className: 'bg-price-dim text-price border border-price-border',         text: 'Ramburs' },
    pending_card:     { className: 'bg-violet/15 text-violet border border-violet/30',           text: 'Plata card' },
    pending_transfer: { className: 'bg-price-dim text-price border border-price-border',         text: 'Transfer' },
    unpaid:           { className: 'bg-base-2 text-muted border border-default',                 text: '—' },
  }
  const cfg = map[status] || { className: 'bg-base-2 text-muted border border-default', text: status }
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${cfg.className}`}>
      {cfg.text}
    </span>
  )
}

// Rand total in detalii comanda
function ProfileTotRow({ label, value, bold, green, amber }) {
  return (
    <div className="flex justify-between mb-1">
      <span className={bold ? 'text-primary font-bold text-[13px]' : 'text-muted text-xs'}>{label}</span>
      <span className={bold ? 'text-price font-bold text-[15px]' : amber ? 'text-price text-xs' : green ? 'text-success text-xs' : 'text-secondary text-xs'}>
        {value}
      </span>
    </div>
  )
}

// Rand in totaluri factura
function ProfileInvRow({ label, value, amber }) {
  return (
    <div className="flex justify-between mb-1.5">
      <span className="text-muted text-[13px]">{label}</span>
      <span className={`text-[13px] ${amber ? 'text-price' : 'text-secondary'}`}>{value}</span>
    </div>
  )
}

// Modal factura — afisare factura proforma sau fiscala
function ProfileInvoiceModal({ invoice, onClose }) {
  const isProforma = invoice.type === 'proforma'
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-5">
      <div onClick={e => e.stopPropagation()} className="bg-base-1 border border-default rounded-2xl max-w-[680px] w-full max-h-[90vh] overflow-auto shadow-elevated">
        <div className={`${isProforma ? 'bg-gradient-to-br from-accent-dim to-base-1' : 'bg-gradient-to-br from-success/10 to-base-1'} p-6 px-7 border-b border-default/40`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`${isProforma ? 'text-accent' : 'text-success'} text-[11px] font-bold uppercase tracking-widest mb-1`}>
                {isProforma ? 'FACTURA PROFORMA' : 'FACTURA FISCALA'}
              </p>
              <h2 className="text-primary text-[22px] font-extrabold mb-1">{invoice.invoice_number}</h2>
              <p className="text-muted text-[13px]">
                Data: {new Date(invoice.date).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-primary font-extrabold text-3xl">{invoice.total_price} RON</p>
              <ProfilePayBadge status={invoice.payment_status} />
            </div>
          </div>
        </div>
        <div className="p-6 px-7">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-surface/50 rounded-xl p-3.5 border border-default">
              <p className="text-muted text-[10px] uppercase tracking-widest mb-2">Furnizor</p>
              <p className="text-primary text-sm font-bold mb-1">{invoice.seller.name}</p>
              <p className="text-secondary text-xs mb-0.5">CUI: {invoice.seller.cui}</p>
              <p className="text-secondary text-xs mb-0.5">Reg. Com.: {invoice.seller.reg_com}</p>
              <p className="text-secondary text-xs mb-0.5">{invoice.seller.address}</p>
              <p className="text-secondary text-xs">IBAN: <span className="font-mono text-[11px]">{invoice.seller.iban}</span></p>
            </div>
            <div className="bg-surface/50 rounded-xl p-3.5 border border-default">
              <p className="text-muted text-[10px] uppercase tracking-widest mb-2">Cumparator</p>
              <p className="text-primary text-sm font-bold mb-1">{invoice.buyer.name}</p>
              <p className="text-secondary text-xs mb-0.5">{invoice.buyer.address}</p>
              {invoice.buyer.postal && <p className="text-secondary text-xs mb-0.5">Cod postal: {invoice.buyer.postal}</p>}
              <p className="text-secondary text-xs">{invoice.buyer.phone}</p>
            </div>
          </div>
          <div className="mb-5">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-base-2 border-b border-default">
                  {['Produs', 'Cant.', 'Pret unitar', 'TVA 19%', 'Total'].map(h => (
                    <th key={h} className={`text-muted text-[11px] uppercase tracking-wider py-2.5 px-3 ${h === 'Produs' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-default/30">
                    <td className="py-2.5 px-3">
                      <p className="text-primary text-[13px] font-medium">{item.name}</p>
                      {item.brand && <p className="text-muted text-[11px]">{item.brand}</p>}
                    </td>
                    <td className="py-2.5 px-3 text-right text-secondary text-[13px]">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right text-secondary text-[13px]">{item.unit_price} RON</td>
                    <td className="py-2.5 px-3 text-right text-muted text-xs">{item.vat} RON</td>
                    <td className="py-2.5 px-3 text-right text-price font-bold text-sm">{item.subtotal} RON</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end mb-5">
            <div className="min-w-[260px]">
              {invoice.shipping_cost > 0 && <ProfileInvRow label="Transport" value={`${invoice.shipping_cost} RON`} />}
              {invoice.cod_fee > 0 && <ProfileInvRow label="Taxa ramburs" value={`${invoice.cod_fee} RON`} amber />}
              <ProfileInvRow label="Baza impozabila" value={`${invoice.total_net} RON`} />
              <ProfileInvRow label="TVA 19%" value={`${invoice.total_vat} RON`} />
              <div className="border-t border-default/40 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-primary font-bold text-sm">TOTAL</span>
                  <span className="text-price font-extrabold text-xl">{invoice.total_price} RON</span>
                </div>
              </div>
            </div>
          </div>
          {isProforma && invoice.bank_details && (
            <div className="bg-accent-dim border border-accent/20 rounded-xl p-4 mb-5">
              <p className="text-accent font-bold text-[13px] mb-3 flex items-center gap-1.5">
                <CurrencyDollar size={14} /> Date pentru transfer bancar
              </p>
              {[
                { label: 'Beneficiar', value: invoice.bank_details.beneficiar },
                { label: 'Banca', value: invoice.seller.bank },
                { label: 'IBAN', value: invoice.bank_details.iban, mono: true },
                { label: 'Suma', value: `${invoice.bank_details.suma} RON`, bold: true },
                { label: 'Referinta', value: invoice.bank_details.referinta, mono: true, amber: true },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-1 border-b border-default/20">
                  <span className="text-muted text-xs">{row.label}</span>
                  <span className={`text-xs font-${row.bold ? '700' : '500'} ${row.amber ? 'text-price' : 'text-primary'} ${row.mono ? 'font-mono' : ''}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2.5 justify-end">
            <button onClick={() => window.print()} className="bg-base-2 border border-default text-secondary text-sm px-4 py-2 rounded-lg cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5">
              <Printer size={14} /> Printeaza
            </button>
            <button onClick={onClose} className="btn-primary flex items-center gap-1.5">Inchide</button>
          </div>
        </div>
      </div>
    </div>
  )
}
