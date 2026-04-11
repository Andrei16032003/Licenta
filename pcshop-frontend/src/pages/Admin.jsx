import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { productsAPI, ordersAPI, productsAdminAPI, retururiAPI, serviceAPI, reviewsAPI, vouchersAPI, teamAPI, supportAPI, clientsAPI, contactAPI } from '../services/api'
import { imgUrl } from '../utils/imgUrl'
import useAuthStore from '../store/authStore'
import API from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'
import {
  Package, ShoppingCart, Wrench, ArrowCounterClockwise, Users, Star, Tag,
  ChartBar, ChartLine, PlusCircle, CircleNotch, MagnifyingGlass, Warning,
  PencilSimple, Trash, Check, X, CaretRight, CaretLeft, Images,
  CalendarBlank, CurrencyDollar, CheckCircle, UserCirclePlus, IdentificationBadge,
  ShieldCheck, Eye, EyeSlash, Headset, ChatCircle, ArrowUp, ClockCounterClockwise,
  EnvelopeSimple, ChatText, LockKey, Broadcast, Gauge, Stack,
} from '@phosphor-icons/react'

/* ─── STATUS CONFIGS ─────────────────────────────────────────────── */
const orderStatusCfg = {
  pending:    { color: '#FFD700', bg: 'rgba(255,215,0,0.12)',    label: 'In asteptare' },
  confirmed:  { color: '#42A5F5', bg: 'rgba(66,165,245,0.12)',  label: 'Confirmat' },
  processing: { color: '#CE93D8', bg: 'rgba(206,147,216,0.12)', label: 'In procesare' },
  shipped:    { color: '#FF9800', bg: 'rgba(255,152,0,0.12)',   label: 'Expediat' },
  delivered:  { color: '#00E676', bg: 'rgba(0,230,118,0.12)',   label: 'Livrat' },
  cancelled:  { color: '#FF5252', bg: 'rgba(255,82,82,0.12)',   label: 'Anulat' },
}
const returStatusCfg = {
  in_asteptare: { color: '#FFD700', bg: 'rgba(255,215,0,0.12)',   label: 'In asteptare' },
  aprobat:      { color: '#00E676', bg: 'rgba(0,230,118,0.12)',   label: 'Aprobat' },
  respins:      { color: '#FF5252', bg: 'rgba(255,82,82,0.12)',   label: 'Respins' },
  finalizat:    { color: '#42A5F5', bg: 'rgba(66,165,245,0.12)', label: 'Finalizat' },
}
const serviceStatusCfg = {
  in_asteptare:      { color: '#FFD700', bg: 'rgba(255,215,0,0.12)',    label: 'In asteptare' },
  va_veni_curierul:  { color: '#FF9800', bg: 'rgba(255,152,0,0.12)',    label: 'Va veni curierul' },
  in_diagnosticare:  { color: '#CE93D8', bg: 'rgba(206,147,216,0.12)', label: 'In diagnosticare' },
  piesa_comandata:   { color: '#42A5F5', bg: 'rgba(66,165,245,0.12)',  label: 'Piesa comandata' },
  in_service:        { color: '#4FC3F7', bg: 'rgba(79,195,247,0.12)',   label: 'In service' },
  rezolvat:          { color: '#00E676', bg: 'rgba(0,230,118,0.12)',    label: 'Rezolvat' },
  respins:           { color: '#FF5252', bg: 'rgba(255,82,82,0.12)',    label: 'Respins' },
}

/* ─── SIDEBAR MENU ───────────────────────────────────────────────── */
const MENU_ALL = [
  { section: 'divider_general',     divider: true, label: 'GENERAL' },
  { section: 'dashboard',           Icon: ChartBar,              label: 'Dashboard' },
  { section: 'manager_dashboard',   Icon: ChartLine,             label: 'Dashboard Manager' },
  { section: 'suport_dashboard',    Icon: Headset,               label: 'Dashboard Suport' },
  { section: 'marketing_dashboard', Icon: Broadcast,             label: 'Dashboard Marketing' },
  { section: 'achizitii_dashboard', Icon: Gauge,                 label: 'Dashboard Achiziții' },
  { section: 'divider_comm',        divider: true, label: 'COMUNICARE' },
  { section: 'contact',             Icon: EnvelopeSimple,        label: 'Mesaje Contact' },
  { section: 'rapoarte',            Icon: ChartLine,             label: 'Rapoarte' },
  { section: 'divider1',     divider: true, label: 'CATALOG' },
  { section: 'products',     Icon: Package,               label: 'Produse' },
  { section: 'add',          Icon: PlusCircle,            label: 'Produs nou' },
  { section: 'divider_stoc', divider: true, label: 'STOC' },
  { section: 'stoc_achizitii',      Icon: Stack,                 label: 'Gestiune Stoc' },
  { section: 'divider2',     divider: true, label: 'VANZARI' },
  { section: 'orders',       Icon: ShoppingCart,          label: 'Comenzi' },
  { section: 'divider3',     divider: true, label: 'SERVICE / RMA' },
  { section: 'service',      Icon: Wrench,                label: 'Cereri service' },
  { section: 'retururi',     Icon: ArrowCounterClockwise, label: 'Retururi' },
  { section: 'divider4',     divider: true, label: 'CLIENTI' },
  { section: 'clients',      Icon: Users,                 label: 'Clienti' },
  { section: 'divider5',        divider: true, label: 'CONTINUT' },
  { section: 'reviews',         Icon: Star,                  label: 'Recenzii' },
  { section: 'vouchers',        Icon: Tag,                   label: 'Vouchere' },
  { section: 'produse_mkt',     Icon: Package,               label: 'Produse & Performanță' },
  { section: 'grafice_mkt',     Icon: ChartLine,             label: 'Grafice & Analize' },
  { section: 'campanii_mkt',    Icon: Broadcast,             label: 'Campanii Produse' },
  { section: 'segmentare_mkt',  Icon: Users,                 label: 'Segmentare Clienți' },
  { section: 'divider6',     divider: true, label: 'ECHIPA' },
  { section: 'team',         Icon: IdentificationBadge,   label: 'Gestionare echipa' },
]

// Sectiunile accesibile per rol
const ROLE_SECTIONS = {
  admin:     new Set(['dashboard','manager_dashboard','contact','rapoarte','products','add','orders','service','retururi','clients','reviews','vouchers','team','marketing_dashboard','produse_mkt','grafice_mkt','campanii_mkt','segmentare_mkt','achizitii_dashboard','stoc_achizitii']),
  manager:   new Set(['manager_dashboard','contact','rapoarte']),
  achizitii: new Set(['achizitii_dashboard','stoc_achizitii','products','add']),
  marketing: new Set(['marketing_dashboard','produse_mkt','vouchers','grafice_mkt','campanii_mkt','segmentare_mkt']),
  suport:    new Set(['suport_dashboard','contact','orders','service','retururi','clients','reviews']),
}

// Etichete afisate in sidebar per rol
const ROLE_LABELS = {
  admin:     'ADMINISTRATOR',
  manager:   'MANAGER',
  achizitii: 'ACHIZITII',
  marketing: 'MARKETING',
  suport:    'SUPORT CLIENTI',
}

// Filtreaza meniul in functie de rolul utilizatorului
function buildMenu(role) {
  const allowed = ROLE_SECTIONS[role] || ROLE_SECTIONS.admin
  const filtered = []
  let pendingDivider = null
  for (const item of MENU_ALL) {
    if (item.divider) { pendingDivider = item; continue }
    if (allowed.has(item.section)) {
      if (pendingDivider) { filtered.push(pendingDivider); pendingDivider = null }
      filtered.push(item)
    }
  }
  return filtered
}

/* ─── STATUS BADGE ───────────────────────────────────────────────── */
function Badge({ cfg, status }) {
  const c = cfg[status] || { color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)', label: status }
  return (
    <span style={{
      fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
      background: c.bg, color: c.color,
      border: `1px solid ${c.color}44`, fontWeight: '700',
      whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  )
}

/* ─── PRIORITY BADGE (static, no interaction) ───────────────────── */
const PRIORITY_CFG = {
  normal:  { color: '#6B7280', bg: 'rgba(107,114,128,0.12)', label: 'Normal' },
  ridicat: { color: '#FF9800', bg: 'rgba(255,152,0,0.12)',   label: 'Ridicat' },
  urgent:  { color: '#FF5252', bg: 'rgba(255,82,82,0.12)',   label: 'Urgent' },
}
function PriorityBadge({ priority }) {
  const c = PRIORITY_CFG[priority] || PRIORITY_CFG.normal
  return (
    <span style={{
      fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
      background: c.bg, color: c.color,
      border: `1px solid ${c.color}55`, fontWeight: '700', whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  )
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────────── */
function SearchGroup({ Icon: IconComp, label, count, onViewAll, empty, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <IconComp size={16} className="text-accent" />
        <span style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px' }}>{label}</span>
        <span className={`rounded-xl px-2 py-0.5 text-[11px] font-bold ${count > 0 ? 'bg-accent/15 text-accent' : 'bg-white/5 text-zinc-600'}`}>
          {count}
        </span>
        {count > 0 && (
          <button onClick={onViewAll} className="ml-auto bg-transparent border-none text-accent text-xs font-semibold cursor-pointer">
            Vezi toate →
          </button>
        )}
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
      }}>
        {count === 0
          ? <p style={{ color: '#4B5563', fontSize: '13px', padding: '14px 16px', margin: 0 }}>{empty}</p>
          : <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
        }
      </div>
    </div>
  )
}

function SearchRow({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-1 px-4 py-2.5 cursor-pointer hover:bg-accent/5 transition-colors border-b border-white/[0.04]"
    >
      {children}
    </div>
  )
}

const STAFF_ROLES = new Set(['admin', 'manager', 'achizitii', 'marketing', 'suport'])

export default function Admin() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const userRole = user?.role || 'admin'
  const MENU = useMemo(() => buildMenu(userRole), [userRole])
  const [section, setSection]             = useState(() => {
    // Prioritate: sectiunea transmisa din profil via router state, altfel default per rol
    if (location.state?.section) return location.state.section
    const defaults = { manager: 'manager_dashboard', achizitii: 'achizitii_dashboard', marketing: 'marketing_dashboard', suport: 'suport_dashboard' }
    return defaults[userRole] || 'dashboard'
  })
  const [collapsed, setCollapsed]         = useState(false)
  const [products, setProducts]           = useState([])
  const [orders, setOrders]               = useState([])
  const [retururi, setRetururi]           = useState([])
  const [serviceReqs, setServiceReqs]     = useState([])
  const [categories, setCategories]       = useState([])
  const [loading, setLoading]             = useState(true)
  const [message, setMessage]             = useState('')
  const [msgOk, setMsgOk]                 = useState(true)
  const [globalSearch, setGlobalSearch]   = useState('')

  // Products state
  const [productSearch, setProductSearch]           = useState('')
  const [productCatFilter, setProductCatFilter]     = useState('')
  const [newProduct, setNewProduct]                 = useState({ name:'', slug:'', brand:'', sku:'', price:'', stock:'', category_id:'', description:'', warranty_months: 24 })
  const [editProduct, setEditProduct]               = useState(null)
  const [editImages, setEditImages]                 = useState([])
  const [imageUploading, setImageUploading]         = useState(false)
  const [editSpecRows, setEditSpecRows]             = useState([])
  const [newSpecRows, setNewSpecRows]               = useState([])

  // Orders state
  const [expandedOrders, setExpandedOrders]   = useState({})
  const [trackingInputs, setTrackingInputs]   = useState({})
  const [savingTracking, setSavingTracking]   = useState({})
  const [confirmingTransfer, setConfirmingTransfer] = useState(null)

  // Rapoarte & stoc
  const [stockThreshold, setStockThreshold]   = useState(3)
  const [restockValues, setRestockValues]     = useState({})
  const [savingRestock, setSavingRestock]     = useState({})
  // Filtre comenzi
  const [orderFilters, setOrderFilters] = useState({ status: '', payment: '', dateFrom: '', dateTo: '', priceMin: '', priceMax: '', search: '' })
  // Clienti
  const [selectedClient, setSelectedClient]   = useState(null)

  // Reviews
  const [adminReviews, setAdminReviews]       = useState([])
  const [reviewFilter, setReviewFilter]       = useState('pending')
  const [rejectTarget, setRejectTarget]       = useState(null)
  const [rejectReason, setRejectReason]       = useState('')
  const [approveTarget, setApproveTarget]     = useState(null)   // review id
  const [approveVerified, setApproveVerified] = useState(false)  // toggle in modal

  // Vouchers
  const [adminVouchers, setAdminVouchers]     = useState([])
  const [voucherForm, setVoucherForm]         = useState({
    code: '', type: 'percent', value: '', description: '',
    min_order_amount: '', category_id: '', user_id: '',
    usage_limit: '', expires_at: '',
  })
  const [showVoucherForm, setShowVoucherForm] = useState(false)
  const [voucherSaving, setVoucherSaving]     = useState(false)
  const [voucherClients, setVoucherClients]   = useState([])
  const [editVoucher, setEditVoucher]         = useState(null)
  const [editVoucherForm, setEditVoucherForm] = useState({})
  const [voucherTargetAll, setVoucherTargetAll] = useState(true)
  const [voucherHasExpiry, setVoucherHasExpiry] = useState(false)
  const [editVoucherTargetAll, setEditVoucherTargetAll] = useState(true)
  const [editVoucherHasExpiry, setEditVoucherHasExpiry] = useState(false)

  // Team management state
  const [teamMembers, setTeamMembers]         = useState([])
  const [teamForm, setTeamForm]               = useState({ name: '', email: '', password: '', role: 'suport', phone: '' })
  const [showTeamForm, setShowTeamForm]       = useState(false)
  const [teamSaving, setTeamSaving]           = useState(false)
  const [editMember, setEditMember]           = useState(null)
  const [editMemberForm, setEditMemberForm]   = useState({})
  const [deleteConfirmMember, setDeleteConfirmMember] = useState(null)

  // Marketing
  const [mktStats, setMktStats]                 = useState([])
  const [mktSort, setMktSort]                   = useState('units_sold_desc')
  const [revTimeline, setRevTimeline]           = useState([])
  const [revPeriod, setRevPeriod]               = useState('day')
  const [clientSegments, setClientSegments]     = useState(null)
  const [mktRatingMin, setMktRatingMin]         = useState('')
  const [mktRatingMax, setMktRatingMax]         = useState('')
  const [mktCatFilter, setMktCatFilter]         = useState('')
  const [mktSearch, setMktSearch]               = useState('')
  const [discountTarget, setDiscountTarget]     = useState(null)   // product object
  const [discountType, setDiscountType]         = useState('percent')
  const [discountValue, setDiscountValue]       = useState('')
  const [discountExpiry, setDiscountExpiry]     = useState('')
  const [discountSaving, setDiscountSaving]     = useState(false)
  const [campTab, setCampTab]                   = useState('active')  // 'active' | 'all'

  // Achizitii
  const [acqStockFilter, setAcqStockFilter]     = useState('all')   // all | zero | low | ok | incomplete
  const [acqSearch, setAcqSearch]               = useState('')
  const [acqRestockValues, setAcqRestockValues] = useState({})
  const [acqRestockSaving, setAcqRestockSaving] = useState({})
  const [acqInlineEdits, setAcqInlineEdits]     = useState({})   // { [id]: { sku, brand, warranty_months } }
  const [acqInlineSaving, setAcqInlineSaving]   = useState({})

  // Contact messages
  const [contactMessages, setContactMessages]   = useState([])
  const [selectedMsg, setSelectedMsg]           = useState(null)
  const [contactFilter, setContactFilter]       = useState('all')   // all | open | resolved
  const [contactSearch, setContactSearch]       = useState('')
  const [contactNoteText, setContactNoteText]   = useState('')
  const [contactNoteSaving, setContactNoteSaving] = useState(false)
  const [contactResolving, setContactResolving] = useState(false)

  // Support: priority dropdowns
  const [priorityDropOpen, setPriorityDropOpen] = useState(null)  // 'service-<id>' | 'retur-<id>' | null

  // Support: notes panels
  const [notesByEntity, setNotesByEntity]     = useState({})      // { 'service-<id>': [...], 'retur-<id>': [...], 'order-<id>': [...] }
  const [openNotesFor, setOpenNotesFor]       = useState(null)    // 'service-<id>' etc.
  const [noteText, setNoteText]               = useState('')
  const [noteSaving, setNoteSaving]           = useState(false)

  // Support: client 360
  const [clientHistory, setClientHistory]     = useState({})      // { userId: { orders, retururi, service } }
  const [clientHistoryTab, setClientHistoryTab] = useState('orders')
  const [loadingHistory, setLoadingHistory]   = useState(false)

  // Reviews: client panel + verified filter
  const [reviewClientOpen, setReviewClientOpen] = useState(null)   // review id
  const [reviewVerifFilter, setReviewVerifFilter] = useState('all') // all | verified | unverified

  /* helpers */
  const specsToRows = (s) => Object.entries(s || {}).map(([k, v]) => ({ key: k, value: String(v) }))
  const rowsToSpecs = (r) => r.filter(x => x.key.trim()).reduce((a, x) => ({ ...a, [x.key.trim()]: x.value }), {})
  const flash = (msg, ok = true) => { setMessage(msg); setMsgOk(ok); setTimeout(() => setMessage(''), 3000) }

  /* load */
  useEffect(() => {
    if (!isAuthenticated || !STAFF_ROLES.has(user?.role)) { navigate('/'); return }
    loadAll()
  }, [isAuthenticated])

  const loadAll = async () => {
    setLoading(true)
    const role = user?.role
    const allowed = ROLE_SECTIONS[role] || ROLE_SECTIONS.admin
    try {
      const needsProducts  = allowed.has('products') || allowed.has('dashboard') || allowed.has('rapoarte') || allowed.has('achizitii_dashboard') || allowed.has('stoc_achizitii') || allowed.has('manager_dashboard')
      const needsOrders    = allowed.has('orders')   || allowed.has('dashboard') || allowed.has('rapoarte') || allowed.has('clients') || allowed.has('manager_dashboard')
      const needsRetururi  = allowed.has('retururi') || allowed.has('dashboard')
      const needsService   = allowed.has('service')  || allowed.has('dashboard')
      const needsReviews   = allowed.has('reviews')
      const needsVouchers  = allowed.has('vouchers')
      const needsClients   = allowed.has('clients')  || allowed.has('vouchers')
      const needsTeam      = role === 'admin'
      const needsContact   = allowed.has('contact')
      const needsMktStats  = allowed.has('marketing_dashboard') || allowed.has('produse_mkt')

      const [prodRes, catRes, ordRes, retRes, svcRes, revRes, voucherRes, clientsRes, teamRes, contactRes, mktRes, timelineRes, segmentsRes] = await Promise.all([
        needsProducts  ? productsAPI.getAll({ limit: 1000 })   : Promise.resolve({ data: { products: [] } }),
        needsProducts  ? productsAPI.getCategories()           : Promise.resolve({ data: [] }),
        needsOrders    ? ordersAPI.getAll()                    : Promise.resolve({ data: [] }),
        needsRetururi  ? retururiAPI.getAll()                  : Promise.resolve({ data: [] }),
        needsService   ? serviceAPI.getAll()                   : Promise.resolve({ data: [] }),
        needsReviews   ? reviewsAPI.getAll()                   : Promise.resolve({ data: [] }),
        needsVouchers  ? vouchersAPI.adminAll()                : Promise.resolve({ data: [] }),
        needsClients   ? API.get('/auth/clients')              : Promise.resolve({ data: [] }),
        needsTeam      ? teamAPI.list()                        : Promise.resolve({ data: [] }),
        needsContact   ? contactAPI.getMessages()              : Promise.resolve({ data: [] }),
        needsMktStats  ? productsAdminAPI.marketingStats()     : Promise.resolve({ data: [] }),
        needsMktStats  ? ordersAPI.revenueTimeline('day')      : Promise.resolve({ data: [] }),
        needsMktStats  ? ordersAPI.clientSegments()            : Promise.resolve({ data: null }),
      ])
      setProducts(prodRes.data.products || [])
      setCategories(catRes.data || [])
      const ords = ordRes.data || []
      setOrders(ords)
      const inputs = {}
      ords.forEach(o => { inputs[o.id] = o.tracking_number || '' })
      setTrackingInputs(inputs)
      setRetururi(retRes.data || [])
      setServiceReqs(svcRes.data || [])
      setAdminReviews(revRes.data || [])
      setAdminVouchers(voucherRes.data || [])
      setVoucherClients(clientsRes.data || [])
      setTeamMembers(teamRes.data || [])
      setContactMessages(contactRes.data || [])
      setMktStats(mktRes.data || [])
      setRevTimeline(timelineRes.data || [])
      setClientSegments(segmentsRes.data || null)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  /* nav helper that also loads data */
  const goTo = (s) => {
    setSection(s)
    setGlobalSearch('')
  }

  const handleRevPeriodChange = async (p) => {
    setRevPeriod(p)
    try {
      const res = await ordersAPI.revenueTimeline(p)
      setRevTimeline(res.data || [])
    } catch { /* ignore */ }
  }

  const handleApplyDiscount = async () => {
    if (!discountTarget || !discountValue) return
    setDiscountSaving(true)
    try {
      const payload = { discount_type: discountType, discount_value: parseFloat(discountValue), expires_at: discountExpiry || null }
      const res = await productsAdminAPI.applyDiscount(discountTarget.id, payload)
      setMktStats(prev => prev.map(p => p.id === discountTarget.id
        ? { ...p, price: res.data.price, old_price: res.data.old_price, discount_expires_at: res.data.discount_expires_at }
        : p
      ))
      setDiscountTarget(null); setDiscountValue(''); setDiscountExpiry('')
      flash('Reducere aplicată!')
    } catch(e) { flash(e?.response?.data?.detail || 'Eroare la aplicarea reducerii', false) }
    finally { setDiscountSaving(false) }
  }

  const handleRemoveDiscount = async (prod) => {
    try {
      const res = await productsAdminAPI.removeDiscount(prod.id)
      setMktStats(prev => prev.map(p => p.id === prod.id ? { ...p, price: res.data.price, old_price: null, discount_expires_at: null } : p))
      flash('Reducere eliminată.')
    } catch { flash('Eroare', false) }
  }

  const discountPreviewPrice = () => {
    if (!discountTarget || !discountValue) return null
    const base = discountTarget.old_price || discountTarget.price
    const val  = parseFloat(discountValue) || 0
    if (discountType === 'percent') return Math.max(0, base * (1 - val/100)).toFixed(2)
    return Math.max(0, base - val).toFixed(2)
  }

  /* ── computed ── */
  const filteredProducts = useMemo(() => {
    const q = (productSearch || globalSearch).toLowerCase()
    return products.filter(p => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || (p.brand||'').toLowerCase().includes(q)
      const matchC = !productCatFilter || p.category === productCatFilter
      return matchQ && matchC
    })
  }, [products, productSearch, productCatFilter, globalSearch])

  const lowStock   = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= stockThreshold), [products, stockThreshold])
  const recentOrds = useMemo(() => [...orders].slice(0, 8), [orders])

  const revenue7 = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().slice(0, 10)
    })
    const totals = {}
    days.forEach(d => { totals[d] = 0 })
    orders.forEach(o => {
      const day = (o.created_at || '').slice(0, 10)
      if (totals[day] !== undefined) totals[day] += parseFloat(o.total_price || 0)
    })
    return days.map(d => ({ day: d.slice(5), val: totals[d] }))
  }, [orders])

  const maxRev = Math.max(...revenue7.map(x => x.val), 1)

  const stats = useMemo(() => ({
    products:  products.length,
    orders:    orders.length,
    revenue:   orders.reduce((s, o) => s + parseFloat(o.total_price || 0), 0),
    retActive: retururi.filter(r => r.status === 'in_asteptare').length,
    svcActive: serviceReqs.filter(s => !['rezolvat','respins'].includes(s.status)).length,
  }), [products, orders, retururi, serviceReqs])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (orderFilters.status && o.status !== orderFilters.status) return false
      if (orderFilters.payment && o.payment_method_type !== orderFilters.payment) return false
      if (orderFilters.dateFrom && (o.created_at || '') < orderFilters.dateFrom) return false
      if (orderFilters.dateTo && (o.created_at || '') > orderFilters.dateTo + 'T23:59:59') return false
      if (orderFilters.priceMin && parseFloat(o.total_price) < parseFloat(orderFilters.priceMin)) return false
      if (orderFilters.priceMax && parseFloat(o.total_price) > parseFloat(orderFilters.priceMax)) return false
      if (orderFilters.search) {
        const q = orderFilters.search.toLowerCase()
        const matchId = (o.invoice_number || '').toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
        const matchClient = (o.shipping_address?.full_name || '').toLowerCase().includes(q)
        const matchPhone = (o.shipping_address?.phone || '').toLowerCase().includes(q)
        if (!matchId && !matchClient && !matchPhone) return false
      }
      return true
    })
  }, [orders, orderFilters])

  const topProducts = useMemo(() => {
    const counts = {}
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const pid = item.product_id
        if (!pid) return
        if (!counts[pid]) counts[pid] = {
          name: item.product_name || '—',
          brand: item.brand || '',
          quantity: 0, revenue: 0
        }
        counts[pid].quantity += item.quantity
        counts[pid].revenue += parseFloat(item.unit_price) * item.quantity
      })
    })
    return Object.values(counts).sort((a, b) => b.quantity - a.quantity).slice(0, 10)
  }, [orders])

  const revenueByCategory = useMemo(() => {
    const catRev = {}
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        const prod = products.find(p => String(p.id) === String(item.product_id))
        const cat = prod?.category || item.product_snapshot?.category || 'Altele'
        catRev[cat] = (catRev[cat] || 0) + parseFloat(item.unit_price) * item.quantity
      })
    })
    return Object.entries(catRev).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [orders, products])

  const uniqueClients = useMemo(() => {
    const map = {}
    orders.forEach(o => {
      const uid = o.user_id
      if (!map[uid]) map[uid] = {
        user_id: uid,
        name: o.shipping_address?.full_name || '—',
        city: o.shipping_address?.city || '—',
        phone: o.shipping_address?.phone || '—',
        orders: [],
        totalSpent: 0
      }
      map[uid].orders.push(o)
      map[uid].totalSpent += parseFloat(o.total_price || 0)
    })
    return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent)
  }, [orders])

  const searchResults = useMemo(() => {
    const q = globalSearch.toLowerCase().trim()
    if (!q) return null
    return {
      products: products.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        (p.brand||'').toLowerCase().includes(q) ||
        (p.category||'').toLowerCase().includes(q) ||
        (p.slug||'').toLowerCase().includes(q)
      ).slice(0, 8),
      orders: orders.filter(o =>
        o.id?.toLowerCase().includes(q) ||
        o.shipping_address?.full_name?.toLowerCase().includes(q) ||
        (o.invoice_number||'').toLowerCase().includes(q) ||
        (o.tracking_number||'').toLowerCase().includes(q)
      ).slice(0, 8),
      clients: uniqueClients.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        (c.city||'').toLowerCase().includes(q) ||
        (c.phone||'').toLowerCase().includes(q)
      ).slice(0, 5),
      retururi: retururi.filter(r =>
        r.product_name?.toLowerCase().includes(q) ||
        (r.order_id||'').toLowerCase().includes(q) ||
        (r.motiv||'').toLowerCase().includes(q)
      ).slice(0, 5),
      service: serviceReqs.filter(s =>
        s.nr_ticket?.toLowerCase().includes(q) ||
        s.product_name?.toLowerCase().includes(q) ||
        (s.descriere||'').toLowerCase().includes(q)
      ).slice(0, 5),
    }
  }, [globalSearch, products, orders, uniqueClients, retururi, serviceReqs])

  /* ── team handlers ── */
  const handleTeamCreate = async (e) => {
    e.preventDefault()
    setTeamSaving(true)
    try {
      await teamAPI.create(teamForm)
      flash('Angajat creat cu succes!')
      setShowTeamForm(false)
      setTeamForm({ name: '', email: '', password: '', role: 'suport', phone: '' })
      const res = await teamAPI.list()
      setTeamMembers(res.data || [])
    } catch (err) { flash(err.response?.data?.detail || 'Eroare la creare', false) }
    finally { setTeamSaving(false) }
  }

  const handleTeamUpdate = async (e) => {
    e.preventDefault()
    try {
      await teamAPI.update(editMember.id, editMemberForm)
      flash('Angajat actualizat!')
      setEditMember(null)
      const res = await teamAPI.list()
      setTeamMembers(res.data || [])
    } catch (err) { flash(err.response?.data?.detail || 'Eroare la actualizare', false) }
  }

  const handleTeamDelete = async () => {
    if (!deleteConfirmMember) return
    try {
      await teamAPI.remove(deleteConfirmMember.id)
      flash('Angajat sters cu succes!')
      setDeleteConfirmMember(null)
      const res = await teamAPI.list()
      setTeamMembers(res.data || [])
    } catch (err) { flash(err.response?.data?.detail || 'Eroare la stergere', false) }
  }

  /* ── support handlers ── */
  const handleSetPriority = async (type, id, priority) => {
    try {
      if (type === 'service') await serviceAPI.setPriority(id, priority)
      else await retururiAPI.setPriority(id, priority)
      setPriorityDropOpen(null)
      loadAll()
    } catch { flash('Eroare la setare prioritate!', false) }
  }

  const loadNotes = async (entityType, entityId) => {
    const key = `${entityType}-${entityId}`
    try {
      const res = await supportAPI.getNotes(entityType, entityId)
      setNotesByEntity(prev => ({ ...prev, [key]: res.data }))
    } catch { /* ignore */ }
  }

  const toggleNotes = (entityType, entityId) => {
    const key = `${entityType}-${entityId}`
    if (openNotesFor === key) { setOpenNotesFor(null); return }
    setOpenNotesFor(key)
    setNoteText('')
    loadNotes(entityType, entityId)
  }

  const saveNote = async (entityType, entityId) => {
    if (!noteText.trim()) return
    const key = `${entityType}-${entityId}`
    setNoteSaving(true)
    try {
      const res = await supportAPI.addNote({ entity_type: entityType, entity_id: entityId, note_text: noteText.trim() })
      setNotesByEntity(prev => ({ ...prev, [key]: [...(prev[key] || []), res.data] }))
      setNoteText('')
    } catch { flash('Eroare la salvare nota!', false) }
    finally { setNoteSaving(false) }
  }

  const loadClientHistory = async (userId) => {
    if (clientHistory[userId]) return
    setLoadingHistory(true)
    try {
      const res = await clientsAPI.history(userId)
      setClientHistory(prev => ({ ...prev, [userId]: res.data }))
    } catch { /* ignore */ }
    finally { setLoadingHistory(false) }
  }

  /* ── handlers ── */
  const handleAddProduct = async (e) => {
    e.preventDefault()
    try {
      await API.post('/products/', {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category_id: parseInt(newProduct.category_id),
        warranty_months: parseInt(newProduct.warranty_months) || 24,
        specs: rowsToSpecs(newSpecRows),
      })
      flash('Produs adaugat!')
      setNewProduct({ name:'', slug:'', brand:'', price:'', stock:'', category_id:'', description:'', warranty_months: 24 })
      setNewSpecRows([])
      loadAll()
    } catch (err) { flash(err.response?.data?.detail || 'Eroare!', false) }
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    try {
      const slug = editProduct.slug?.trim() || editProduct.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
      await productsAdminAPI.update(editProduct.id, {
        name: editProduct.name, slug,
        brand: editProduct.brand, model: editProduct.model || '',
        sku: editProduct.sku || null,
        description: editProduct.description || '',
        price: parseFloat(editProduct.price),
        old_price: editProduct.old_price ? parseFloat(editProduct.old_price) : null,
        stock: parseInt(editProduct.stock),
        category_id: parseInt(editProduct.category_id),
        warranty_months: parseInt(editProduct.warranty_months) || 24,
        specs: rowsToSpecs(editSpecRows),
      })
      flash('Produs actualizat!')
      setEditProduct(null); setEditSpecRows([]); setEditImages([])
      loadAll()
    } catch (err) { flash(err.response?.data?.detail || 'Eroare!', false) }
  }

  const loadProductImages = async (id) => {
    try { const r = await productsAdminAPI.getImages(id); setEditImages(r.data) }
    catch { setEditImages([]) }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return
    setImageUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      await productsAdminAPI.uploadImage(editProduct.id, fd)
      await loadProductImages(editProduct.id)
      flash('Imagine incarcata!')
    } catch { flash('Eroare imagine!', false) }
    finally { setImageUploading(false) }
  }

  const handleDeleteImage = async (imgId) => {
    try {
      await productsAdminAPI.deleteImage(imgId)
      await loadProductImages(editProduct.id)
      flash('Imagine stearsa!')
    } catch { flash('Eroare!', false) }
  }

  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`Dezactiveaza "${name}"?`)) return
    try { await productsAdminAPI.delete(id); flash('Produs dezactivat!'); loadAll() }
    catch { flash('Eroare!', false) }
  }

  const handleUpdateStatus = async (orderId, status) => {
    try { await ordersAPI.updateStatus(orderId, status); loadAll(); flash('Status actualizat!') }
    catch { flash('Eroare!', false) }
  }

  const handleConfirmTransfer = async (orderId) => {
    setConfirmingTransfer(orderId)
    try { await ordersAPI.confirmTransfer(orderId); loadAll(); flash('Transfer confirmat!') }
    catch { flash('Eroare!', false) }
    finally { setConfirmingTransfer(null) }
  }

  const handleSaveTracking = async (orderId) => {
    setSavingTracking(p => ({ ...p, [orderId]: true }))
    try { await ordersAPI.updateTracking(orderId, trackingInputs[orderId]); flash('Tracking salvat!') }
    catch { flash('Eroare!', false) }
    finally { setSavingTracking(p => ({ ...p, [orderId]: false })) }
  }

  const handleUpdateReturStatus  = async (id, status) => {
    try { await retururiAPI.updateStatus(id, status); loadAll(); flash('Status retur actualizat!') }
    catch { flash('Eroare!', false) }
  }

  const handleUpdateServiceStatus = async (id, status) => {
    try { await serviceAPI.updateStatus(id, status); loadAll(); flash('Status service actualizat!') }
    catch { flash('Eroare!', false) }
  }

  const exportCSV = (rows, filename) => {
    if (!rows.length) return
    const headers = Object.keys(rows[0]).join(',')
    const body = rows.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([headers + '\n' + body], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const exportProductsCSV = () => exportCSV(
    products.map(p => ({ Nume: p.name, Brand: p.brand, Categorie: p.category, Pret: p.price, Stoc: p.stock, Status: p.stock > 0 ? 'In stoc' : 'Epuizat' })),
    'produse_stoc.csv'
  )

  const exportOrdersCSV = () => exportCSV(
    orders.map(o => ({ ID: o.id, Client: o.shipping_address?.full_name, Oras: o.shipping_address?.city, Total: o.total_price, Plata: o.payment_method_type, Status: o.status, Factura: o.invoice_number, Data: new Date(o.created_at).toLocaleDateString('ro-RO') })),
    'comenzi.csv'
  )

  const handleRestock = async (productId, newStock) => {
    setSavingRestock(p => ({ ...p, [productId]: true }))
    try {
      const prod = products.find(p => p.id === productId)
      const catId = categories.find(c => c.name === prod.category)?.id
      await productsAdminAPI.update(productId, {
        name: prod.name, slug: prod.slug, brand: prod.brand, model: prod.model || '',
        description: prod.description || '', price: parseFloat(prod.price),
        old_price: prod.old_price ? parseFloat(prod.old_price) : null,
        stock: parseInt(newStock), category_id: catId,
        warranty_months: prod.warranty_months || 24, specs: prod.specs || {}
      })
      flash('Stoc actualizat!')
      loadAll()
    } catch { flash('Eroare reaprovizionare!', false) }
    finally { setSavingRestock(p => ({ ...p, [productId]: false })) }
  }

  /* ── STYLES ── */
  const tableWrap = {
    background: 'rgba(255,255,255,0.02)', borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden',
  }
  const th = {
    textAlign: 'left', padding: '12px 16px', color: '#6B7280',
    fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px',
    background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)',
    whiteSpace: 'nowrap',
  }
  const td = { padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }

  const SIDEBAR_W  = collapsed ? 64 : 240

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <CircleNotch size={32} className="animate-spin text-accent" />
    </div>
  )

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display:'flex', minHeight:'calc(100vh - 60px)', background:'#080C18' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: SIDEBAR_W, flexShrink: 0,
        background: 'linear-gradient(180deg, #0D1421 0%, #0A1020 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: 'calc(100vh - 60px)',
        overflowY: 'auto', overflowX: 'hidden',
        transition: 'width 0.25s ease',
        zIndex: 10,
      }}>
        {/* Logo + toggle */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '18px 0' : '18px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {!collapsed && (
            <div>
              <div style={{ color: 'var(--cyan)', fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px' }}>
                PCShop
              </div>
              <div style={{ color: '#4B5563', fontSize: '10px', letterSpacing: '1px' }}>ADMIN PANEL</div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#9CA3AF', width: '30px', height: '30px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {collapsed ? <CaretRight size={14} /> : <CaretLeft size={14} />}
          </button>
        </div>


        {/* Menu items */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {MENU.map((item, idx) => {
            if (item.divider) return (
              <div key={idx} style={{
                padding: collapsed ? '14px 0 6px' : '14px 16px 6px',
                color: '#374151', fontSize: '10px', fontWeight: '700', letterSpacing: '1px',
                textAlign: collapsed ? 'center' : 'left',
              }}>
                {collapsed ? '·' : item.label}
              </div>
            )
            const isActive = section === item.section
            const pendingReviews = adminReviews.filter(r => !r.is_approved && !r.rejection_reason).length
            const badge = item.section === 'service' ? (stats.svcActive || 0)
                        : item.section === 'retururi' ? (stats.retActive || 0)
                        : item.section === 'reviews' ? pendingReviews
                        : item.section === 'contact' ? contactMessages.filter(m => !m.is_resolved).length : 0
            return (
              <button key={item.section} onClick={() => goTo(item.section)} style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: '10px', padding: collapsed ? '10px 0' : '10px 16px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive ? 'linear-gradient(90deg, rgba(0,212,255,0.12), transparent)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--cyan)' : '3px solid transparent',
                border: 'none', cursor: 'pointer',
                color: isActive ? 'var(--cyan)' : '#9CA3AF',
                fontSize: '13px', fontWeight: isActive ? '600' : '400',
                transition: 'all 0.15s', textAlign: 'left',
              }}>
                <item.Icon size={16} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {badge > 0 && (
                      <span style={{
                        background: '#FF5252', color: 'white',
                        borderRadius: '10px', padding: '1px 7px', fontSize: '10px', fontWeight: '700',
                      }}>{badge}</span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom user info */}
        {!collapsed && (
          <div style={{
            padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-dark text-sm font-bold shrink-0">
              {(user?.email || 'A')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || user?.email || 'Admin'}
              </div>
              <div style={{ color: 'var(--cyan)', fontSize: '10px', fontWeight: '700' }}>{ROLE_LABELS[userRole] || 'STAFF'}</div>
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, padding: '28px', overflowX: 'hidden', minWidth: 0 }}>

        {/* Flash message */}
        {message && (
          <div className={`${msgOk ? 'bg-success/10 border border-success/30 text-success' : 'bg-danger/10 border border-danger/30 text-danger'} px-4 py-3 rounded-xl mb-5 text-sm`}>
            {message}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            DASHBOARD
        ══════════════════════════════════════════════════════ */}
        {/* ══════════════════════════════════════════════════════
            CAUTARE GLOBALA
        ══════════════════════════════════════════════════════ */}
        {section === 'search' && searchResults && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800' }}>
                <MagnifyingGlass size={20} className="text-accent" style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                Rezultate pentru <span style={{ color: 'var(--cyan)' }}>"{globalSearch}"</span>
              </h1>
              <span style={{ color: '#4B5563', fontSize: '13px' }}>
                {[searchResults.products, searchResults.orders, searchResults.clients, searchResults.retururi, searchResults.service].reduce((s,a) => s + a.length, 0)} rezultate totale
              </span>
            </div>

            {/* Produse */}
            <SearchGroup
              Icon={Package} label="Produse" count={searchResults.products.length}
              onViewAll={() => { setProductSearch(globalSearch); setGlobalSearch(''); goTo('products') }}
              empty="Niciun produs gasit"
            >
              {searchResults.products.map(p => (
                <SearchRow key={p.id} onClick={() => { setProductSearch(globalSearch); setGlobalSearch(''); goTo('products') }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '13px' }}>{p.name}</span>
                    <span style={{ color: '#4B5563', fontSize: '12px', marginLeft: '8px' }}>{p.brand}</span>
                    <span style={{ color: 'var(--cyan)', fontSize: '11px', marginLeft: '8px' }}>{p.category}</span>
                  </div>
                  <span style={{ color: '#00E676', fontWeight: '700', fontSize: '13px' }}>{p.price} RON</span>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px',
                    background: p.stock > 0 ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)',
                    color: p.stock > 0 ? '#00E676' : '#FF5252',
                    border: `1px solid ${p.stock > 0 ? 'rgba(0,230,118,0.3)' : 'rgba(255,82,82,0.3)'}`,
                  }}>{p.stock} buc</span>
                </SearchRow>
              ))}
            </SearchGroup>

            {/* Comenzi */}
            <SearchGroup
              Icon={ShoppingCart} label="Comenzi" count={searchResults.orders.length}
              onViewAll={() => { setGlobalSearch(''); goTo('orders') }}
              empty="Nicio comanda gasita"
            >
              {searchResults.orders.map(o => (
                <SearchRow key={o.id} onClick={() => { setExpandedOrders(p => ({ ...p, [o.id]: true })); setGlobalSearch(''); goTo('orders') }}>
                  <span style={{ color: '#6B7280', fontFamily: 'monospace', fontSize: '12px' }}>#{o.id.slice(0,8).toUpperCase()}</span>
                  <span style={{ color: '#F1F5F9', fontSize: '13px', marginLeft: '12px', fontWeight: '500' }}>
                    {o.shipping_address?.full_name || '—'}
                  </span>
                  <span style={{ color: '#4B5563', fontSize: '12px', marginLeft: '8px' }}>
                    {o.shipping_address?.city}
                  </span>
                  <span style={{ color: 'var(--cyan)', fontSize: '12px', marginLeft: 'auto', fontFamily: 'monospace' }}>
                    {o.invoice_number || '—'}
                  </span>
                  <span style={{ color: '#00E676', fontWeight: '700', fontSize: '13px', marginLeft: '12px' }}>
                    {o.total_price} RON
                  </span>
                  <span style={{ marginLeft: '10px' }}><Badge cfg={orderStatusCfg} status={o.status} /></span>
                </SearchRow>
              ))}
            </SearchGroup>

            {/* Clienti */}
            <SearchGroup
              Icon={Users} label="Clienti" count={searchResults.clients.length}
              onViewAll={() => { setGlobalSearch(''); goTo('clients') }}
              empty="Niciun client gasit"
            >
              {searchResults.clients.map(c => (
                <SearchRow key={c.user_id} onClick={() => { setSelectedClient(c); setGlobalSearch(''); goTo('clients') }}>
                  <span style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '13px' }}>{c.name}</span>
                  <span style={{ color: '#4B5563', fontSize: '12px', marginLeft: '8px' }}>{c.city}</span>
                  <span style={{ color: '#CE93D8', fontSize: '12px', marginLeft: '8px' }}>{c.phone}</span>
                  <span style={{ color: 'var(--cyan)', fontWeight: '700', fontSize: '13px', marginLeft: 'auto' }}>{c.orders.length} comenzi</span>
                  <span style={{ color: '#00E676', fontWeight: '700', fontSize: '13px', marginLeft: '12px' }}>{c.totalSpent.toFixed(0)} RON</span>
                </SearchRow>
              ))}
            </SearchGroup>

            {/* Retururi */}
            <SearchGroup
              Icon={ArrowCounterClockwise} label="Retururi" count={searchResults.retururi.length}
              onViewAll={() => { setGlobalSearch(''); goTo('retururi') }}
              empty="Niciun retur gasit"
            >
              {searchResults.retururi.map(r => (
                <SearchRow key={r.id} onClick={() => { setGlobalSearch(''); goTo('retururi') }}>
                  <span style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '13px' }}>{r.product_name}</span>
                  <span style={{ color: '#6B7280', fontFamily: 'monospace', fontSize: '11px', marginLeft: '8px' }}>#{(r.order_id||'').slice(0,8).toUpperCase()}</span>
                  <span style={{ color: '#9CA3AF', fontSize: '12px', marginLeft: '8px' }}>{r.motiv}</span>
                  <span style={{ marginLeft: 'auto' }}><Badge cfg={returStatusCfg} status={r.status} /></span>
                </SearchRow>
              ))}
            </SearchGroup>

            {/* Service */}
            <SearchGroup
              Icon={Wrench} label="Service" count={searchResults.service.length}
              onViewAll={() => { setGlobalSearch(''); goTo('service') }}
              empty="Nicio cerere service gasita"
            >
              {searchResults.service.map(s => (
                <SearchRow key={s.id} onClick={() => { setGlobalSearch(''); goTo('service') }}>
                  <span style={{ color: '#FF9800', fontFamily: 'monospace', fontSize: '12px', fontWeight: '700' }}>{s.nr_ticket}</span>
                  <span style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '13px', marginLeft: '12px' }}>{s.product_name}</span>
                  <span style={{ color: '#9CA3AF', fontSize: '12px', marginLeft: '8px' }}>{(s.descriere||'').slice(0,50)}{s.descriere?.length > 50 ? '…' : ''}</span>
                  <span style={{ marginLeft: 'auto' }}><Badge cfg={serviceStatusCfg} status={s.status} /></span>
                </SearchRow>
              ))}
            </SearchGroup>

            {[searchResults.products, searchResults.orders, searchResults.clients, searchResults.retururi, searchResults.service].every(a => a.length === 0) && (
              <div style={{ textAlign: 'center', padding: '60px', color: '#4B5563' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  <MagnifyingGlass size={48} style={{ margin: '0 auto', display: 'block', color: '#4B5563' }} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#6B7280' }}>Niciun rezultat pentru "{globalSearch}"</div>
                <div style={{ fontSize: '13px', marginTop: '8px' }}>Incearca alte cuvinte cheie</div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════���═════════════════════��════════════════
            SUPORT DASHBOARD
        ══════════════════════════════════════════════════════ */}
        {section === 'manager_dashboard' && (() => {
          const today      = new Date()
          const todayStr   = today.toISOString().slice(0, 10)
          const thisMonth  = today.toISOString().slice(0, 7)
          const nonCancelled = orders.filter(o => o.status !== 'cancelled')
          const revenueToday  = orders.filter(o => (o.created_at||'').startsWith(todayStr) && o.status !== 'cancelled').reduce((s,o) => s + parseFloat(o.total_price||0), 0)
          const revenueMonth  = orders.filter(o => (o.created_at||'').startsWith(thisMonth) && o.status !== 'cancelled').reduce((s,o) => s + parseFloat(o.total_price||0), 0)
          const revenueTotal  = nonCancelled.reduce((s,o) => s + parseFloat(o.total_price||0), 0)
          const avgOrder      = nonCancelled.length ? revenueTotal / nonCancelled.length : 0
          const deliveredPct  = orders.length ? Math.round(orders.filter(o => o.status === 'delivered').length / orders.length * 100) : 0
          const cancelledPct  = orders.length ? Math.round(orders.filter(o => o.status === 'cancelled').length / orders.length * 100) : 0
          const ordersByStatus = ['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => ({
            status: s, label: orderStatusCfg[s]?.label || s, count: orders.filter(o => o.status === s).length, color: orderStatusCfg[s]?.color || '#6B7280',
          }))
          const maxStatusCount = Math.max(...ordersByStatus.map(s => s.count), 1)
          const top5 = topProducts.slice(0, 5)
          const areaData = revenue7.map(d => ({ zi: d.day, Venituri: Math.round(d.val) }))
          const tooltipStyleMgr = { contentStyle: { background: '#0D1421', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#F1F5F9', fontSize: '12px' }, labelStyle: { color: '#9CA3AF', fontSize: '11px' }, cursor: { fill: 'rgba(255,255,255,0.04)' } }
          const zeroStockCount = products.filter(p => p.stock === 0).length
          const lowStockCount  = products.filter(p => p.stock > 0 && p.stock <= 5).length
          const openService  = serviceReqs.filter(s => !['rezolvat','respins'].includes(s.status)).length
          const openRetururi = retururi.filter(r => r.status === 'in_asteptare').length
          return (
            <div>
              <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Dashboard Manager</h1>
              <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '20px' }}>Situație generală afacere — venituri, comenzi, stoc, operațional</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
                {[
                  { label: 'Venituri azi',          value: revenueToday.toFixed(0) + ' RON', color: '#0EF6FF', sub: 'comenzi neanulate' },
                  { label: 'Venituri luna curentă',  value: revenueMonth.toFixed(0) + ' RON', color: '#00E676', sub: today.toLocaleString('ro-RO', { month: 'long', year: 'numeric' }) },
                  { label: 'Valoare medie comandă',  value: avgOrder.toFixed(0) + ' RON',     color: '#CE93D8', sub: `din ${orders.length} comenzi total` },
                  { label: 'Livrare succes',         value: deliveredPct + '%',               color: '#42A5F5', sub: `anulare ${cancelledPct}%` },
                ].map(k => (
                  <div key={k.label} style={{ background: '#0F1923', border: `1px solid ${k.color}33`, borderRadius: '14px', padding: '20px' }}>
                    <div style={{ color: k.color, fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{k.label}</div>
                    <div style={{ color: '#F1F5F9', fontSize: '32px', fontWeight: '800', lineHeight: 1 }}>{k.value}</div>
                    <div style={{ color: '#4B5563', fontSize: '11px', marginTop: '5px' }}>{k.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '22px' }}>
                  <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px', marginBottom: '18px' }}>Venituri — ultimele 7 zile</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={areaData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="mgrRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0EF6FF" stopOpacity={0.25} /><stop offset="95%" stopColor="#0EF6FF" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="zi" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? v + ' RON' : ''} width={72} />
                      <Tooltip {...tooltipStyleMgr} formatter={v => [v + ' RON', 'Venituri']} />
                      <Area type="monotone" dataKey="Venituri" stroke="#0EF6FF" strokeWidth={2} fill="url(#mgrRev)" dot={{ fill: '#0EF6FF', r: 3 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '22px' }}>
                  <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px', marginBottom: '18px' }}>Comenzi pe status</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {ordersByStatus.map(s => (
                      <div key={s.status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#9CA3AF', fontSize: '11px' }}>{s.label}</span>
                          <span style={{ color: s.color, fontSize: '12px', fontWeight: '700' }}>{s.count}</span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(s.count / maxStatusCount) * 100}%`, background: s.color, borderRadius: '3px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '22px' }}>
                  <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>Top 5 produse vândute</div>
                  {top5.length === 0 ? <p style={{ color: '#4B5563', fontSize: '13px' }}>Nu există date despre vânzări.</p> : top5.map((p, i) => {
                    const maxQ = top5[0].quantity || 1
                    return (
                      <div key={i} style={{ marginBottom: i < top5.length - 1 ? '14px' : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>{p.name}</span>
                          <span style={{ color: '#9CA3AF', fontSize: '11px', flexShrink: 0, marginLeft: '8px' }}>{p.quantity} buc · {p.revenue.toFixed(0)} RON</span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(p.quantity / maxQ) * 100}%`, background: ['#0EF6FF','#00E676','#CE93D8','#42A5F5','#FFD700'][i], borderRadius: '3px' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '22px' }}>
                  <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>Indicatori operaționali</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { label: 'Produse catalog',    value: products.length,                       color: '#42A5F5',  sub: 'total SKU-uri active' },
                      { label: 'Stoc zero',          value: zeroStockCount,                        color: zeroStockCount > 0 ? '#FF5252' : '#00E676',  sub: zeroStockCount > 0 ? 'necesită aprovizionare urgentă' : 'totul aprovizionat ✓' },
                      { label: 'Stoc redus (≤5)',    value: lowStockCount,                         color: lowStockCount > 0 ? '#FF9800' : '#00E676',   sub: lowStockCount > 0 ? 'sub pragul de alertă' : 'stoc în regulă ✓' },
                      { label: 'Service deschis',    value: openService,                           color: openService > 0 ? '#CE93D8' : '#00E676',     sub: 'tichete nerezolvate' },
                      { label: 'Retururi așteptare', value: openRetururi,                          color: openRetururi > 0 ? '#FFD700' : '#00E676',    sub: 'necesită procesare' },
                      { label: 'Venituri totale',    value: revenueTotal.toFixed(0) + ' RON',      color: '#0EF6FF',  sub: 'toate comenzile active' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div>
                          <div style={{ color: '#9CA3AF', fontSize: '11px' }}>{item.label}</div>
                          <div style={{ color: '#4B5563', fontSize: '10px' }}>{item.sub}</div>
                        </div>
                        <div style={{ color: item.color, fontSize: '18px', fontWeight: '800' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {section === 'suport_dashboard' && (() => {
          const pendingOrders   = orders.filter(o => ['pending','confirmed','processing'].includes(o.status))
          const pendingRetururi = retururi.filter(r => r.status === 'in_asteptare')
          const pendingService  = serviceReqs.filter(s => !['rezolvat','respins'].includes(s.status))
          const pendingReviews  = adminReviews.filter(r => !r.is_approved && !r.rejection_reason)

          const urgentItems = [
            ...serviceReqs.filter(s => (s.priority === 'urgent' || s.priority === 'ridicat') && !['rezolvat','respins'].includes(s.status))
              .map(s => ({ type: 'service', label: `Service ${s.nr_ticket} — ${s.product_name}`, priority: s.priority, section: 'service' })),
            ...retururi.filter(r => (r.priority === 'urgent' || r.priority === 'ridicat') && r.status === 'in_asteptare')
              .map(r => ({ type: 'retur', label: `Retur — ${r.product_name}`, priority: r.priority, section: 'retururi' })),
            ...orders.filter(o => o.payment_method_type === 'transfer' && o.status === 'pending')
              .map(o => ({ type: 'order', label: `Comandă ${o.invoice_number||'#'+o.id.slice(0,6).toUpperCase()} — transfer neconfirmat`, priority: 'ridicat', section: 'orders' })),
          ].sort((a,b) => (a.priority==='urgent'?0:1) - (b.priority==='urgent'?0:1)).slice(0,8)

          return (
            <div>
              <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Dashboard Suport</h1>
              <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '20px' }}>Rezumat al activității curente de suport</p>

              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '20px' }}>
                {[
                  { label: 'Comenzi noi',        value: pendingOrders.length,                                color: '#FF5252', onClick: () => goTo('orders'),   sub: pendingOrders.length === 0 ? 'Totul în regulă ✓' : 'Necesită atenție →' },
                  { label: 'Retururi așteptare',  value: pendingRetururi.length,                             color: '#FFD700', onClick: () => goTo('retururi'),  sub: pendingRetururi.length === 0 ? 'Totul în regulă ✓' : 'Necesită atenție →' },
                  { label: 'Service deschis',     value: pendingService.length,                              color: '#CE93D8', onClick: () => goTo('service'),   sub: pendingService.length === 0 ? 'Totul în regulă ✓' : 'Necesită atenție →' },
                  { label: 'Recenzii moderate',   value: pendingReviews.length,                              color: '#0EF6FF', onClick: () => goTo('reviews'),   sub: pendingReviews.length === 0 ? 'Totul în regulă ✓' : 'Necesită atenție →' },
                  { label: 'Mesaje contact noi',  value: contactMessages.filter(m => !m.is_resolved).length, color: '#00E676', onClick: () => goTo('contact'),  sub: contactMessages.filter(m => !m.is_resolved).length === 0 ? 'Totul în regulă ✓' : 'Necesită atenție →' },
                ].map(k => (
                  <div key={k.label} onClick={k.onClick}
                    style={{ background: '#0F1923', border: `1px solid ${k.color}33`, borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = k.color+'77'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = k.color+'33'}
                  >
                    <div style={{ color: k.color, fontSize: '10px', fontWeight: '700', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' }}>{k.label}</div>
                    <div style={{ color: '#F1F5F9', fontSize: '32px', fontWeight: '800', lineHeight: 1 }}>{k.value}</div>
                    <div style={{ color: '#4B5563', fontSize: '11px', marginTop: '5px' }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Row 2: Urgent items + Status service/retur */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

                {/* Urgent items */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <Warning size={16} color="#FF5252" />
                    <span style={{ color: '#FF5252', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Necesită atenție acum</span>
                    <span style={{ background: 'rgba(255,82,82,0.12)', color: '#FF5252', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', marginLeft: 'auto' }}>{urgentItems.length}</span>
                  </div>
                  {urgentItems.length === 0 ? (
                    <div style={{ color: '#4B5563', fontSize: '13px', padding: '12px 0' }}>Niciun item urgent. Bună treabă! ✓</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {urgentItems.map((item, i) => (
                        <div key={i} onClick={() => goTo(item.section)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: item.priority==='urgent' ? 'rgba(255,82,82,0.06)' : 'rgba(255,152,0,0.06)', borderRadius: '8px', borderLeft: `3px solid ${item.priority==='urgent'?'#FF5252':'#FF9800'}`, cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = item.priority==='urgent'?'rgba(255,82,82,0.1)':'rgba(255,152,0,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = item.priority==='urgent'?'rgba(255,82,82,0.06)':'rgba(255,152,0,0.06)'}
                        >
                          <PriorityBadge priority={item.priority} />
                          <span style={{ color: '#D1D5DB', fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                          <span style={{ color: '#0EF6FF', fontSize: '11px', flexShrink: 0 }}>→</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status service + retur breakdown */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px 20px' }}>
                  <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '14px', marginBottom: '14px' }}>Distribuție status — Service & Retururi</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ color: '#CE93D8', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Service</div>
                      {Object.entries(serviceStatusCfg).map(([key, cfg]) => {
                        const cnt = serviceReqs.filter(s => s.status === key).length
                        const maxSvc = Math.max(...Object.keys(serviceStatusCfg).map(k => serviceReqs.filter(s => s.status === k).length), 1)
                        return (
                          <div key={key} style={{ marginBottom: '7px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                              <span style={{ color: '#9CA3AF', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>{cfg.label}</span>
                              <span style={{ color: cfg.color, fontSize: '10px', fontWeight: '700', flexShrink: 0, marginLeft: '4px' }}>{cnt}</span>
                            </div>
                            <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${cnt / maxSvc * 100}%`, background: cfg.color, borderRadius: '2px' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div>
                      <div style={{ color: '#FFD700', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Retururi</div>
                      {Object.entries(returStatusCfg).map(([key, cfg]) => {
                        const cnt = retururi.filter(r => r.status === key).length
                        const maxRet = Math.max(...Object.keys(returStatusCfg).map(k => retururi.filter(r => r.status === k).length), 1)
                        return (
                          <div key={key} style={{ marginBottom: '7px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                              <span style={{ color: '#9CA3AF', fontSize: '10px' }}>{cfg.label}</span>
                              <span style={{ color: cfg.color, fontSize: '10px', fontWeight: '700' }}>{cnt}</span>
                            </div>
                            <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${cnt / maxRet * 100}%`, background: cfg.color, borderRadius: '2px' }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Comenzi recente + Mesaje contact nerezolvate */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Recent orders */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Comenzi recente neprocessate</span>
                    <button onClick={() => goTo('orders')} style={{ background: 'transparent', border: 'none', color: '#0EF6FF', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Toate →</button>
                  </div>
                  {pendingOrders.length === 0 ? (
                    <div style={{ padding: '20px', color: '#4B5563', fontSize: '13px' }}>Nicio comandă în așteptare ✓</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {pendingOrders.slice(0, 5).map((o, i) => (
                        <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', borderBottom: i < Math.min(pendingOrders.length, 5) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#0EF6FF', fontSize: '11px', fontFamily: 'monospace', fontWeight: '700' }}>{o.invoice_number || '#'+o.id.slice(0,8).toUpperCase()}</div>
                            <div style={{ color: '#9CA3AF', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.shipping_address?.full_name || '—'}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ color: '#00E676', fontSize: '12px', fontWeight: '700' }}>{parseFloat(o.total_price||0).toFixed(0)} RON</div>
                            <Badge cfg={orderStatusCfg} status={o.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent contact messages */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Mesaje contact nerezolvate</span>
                    <button onClick={() => goTo('contact')} style={{ background: 'transparent', border: 'none', color: '#0EF6FF', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Toate →</button>
                  </div>
                  {contactMessages.filter(m => !m.is_resolved).length === 0 ? (
                    <div style={{ padding: '20px', color: '#4B5563', fontSize: '13px' }}>Niciun mesaj nerezolvat ✓</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {contactMessages.filter(m => !m.is_resolved).slice(0, 5).map((m, i, arr) => (
                        <div key={m.id} onClick={() => goTo('contact')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</div>
                            <div style={{ color: '#6B7280', fontSize: '11px' }}>{m.name} · {m.email}</div>
                          </div>
                          <div style={{ color: '#4B5563', fontSize: '10px', flexShrink: 0 }}>{new Date(m.created_at).toLocaleDateString('ro-RO')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════
            MESAJE CONTACT
        ══════════════════════════════════════════════════════════ */}
        {section === 'contact' && (() => {
          const unresolved = contactMessages.filter(m => !m.is_resolved).length
          const filtered = contactMessages.filter(m => {
            if (contactFilter === 'open'     && m.is_resolved)  return false
            if (contactFilter === 'resolved' && !m.is_resolved) return false
            if (contactSearch) {
              const q = contactSearch.toLowerCase()
              return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q)
            }
            return true
          })

          const handleResolve = async (msg) => {
            setContactResolving(true)
            try {
              const res = await contactAPI.resolve(msg.id)
              setContactMessages(prev => prev.map(m =>
                m.id === msg.id ? { ...m, is_resolved: res.data.is_resolved, resolved_by_name: res.data.resolved_by_name } : m
              ))
              if (selectedMsg?.id === msg.id)
                setSelectedMsg(prev => ({ ...prev, is_resolved: res.data.is_resolved, resolved_by_name: res.data.resolved_by_name }))
            } catch { flash('Eroare la actualizare', false) }
            finally { setContactResolving(false) }
          }

          const handleAddNote = async () => {
            if (!contactNoteText.trim() || !selectedMsg) return
            setContactNoteSaving(true)
            try {
              const res = await contactAPI.addNote(selectedMsg.id, { note_text: contactNoteText.trim() })
              const newNote = res.data
              setContactMessages(prev => prev.map(m =>
                m.id === selectedMsg.id ? { ...m, notes: [...(m.notes || []), newNote] } : m
              ))
              setSelectedMsg(prev => ({ ...prev, notes: [...(prev.notes || []), newNote] }))
              setContactNoteText('')
            } catch { flash('Eroare la salvarea notei', false) }
            finally { setContactNoteSaving(false) }
          }

          return (
            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', height: 'calc(100vh - 120px)', minHeight: '600px' }}>

              {/* ── LISTA MESAJE ───────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', background: '#0F1923', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <EnvelopeSimple size={18} color="#0EF6FF" />
                    <span style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px' }}>Inbox Contact</span>
                    {unresolved > 0 && (
                      <span style={{ background: 'rgba(255,82,82,0.15)', color: '#FF5252', border: '1px solid rgba(255,82,82,0.3)', borderRadius: '20px', padding: '1px 8px', fontSize: '11px', fontWeight: '700', marginLeft: 'auto' }}>
                        {unresolved} noi
                      </span>
                    )}
                  </div>
                  {/* Search */}
                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <MagnifyingGlass size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
                    <input
                      value={contactSearch}
                      onChange={e => setContactSearch(e.target.value)}
                      placeholder="Cauta dupa nume, email, subiect..."
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 10px 7px 30px', color: '#F1F5F9', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                  {/* Filter tabs */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[['all','Toate'], ['open','Deschise'], ['resolved','Rezolvate']].map(([val, lbl]) => (
                      <button key={val} onClick={() => setContactFilter(val)}
                        style={{ flex: 1, padding: '5px', borderRadius: '7px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                          background: contactFilter === val ? 'rgba(14,246,255,0.12)' : 'rgba(255,255,255,0.04)',
                          color: contactFilter === val ? '#0EF6FF' : '#6B7280',
                        }}>
                        {lbl}
                        <span style={{ marginLeft: '4px', opacity: 0.7 }}>
                          ({val === 'all' ? contactMessages.length : val === 'open' ? unresolved : contactMessages.length - unresolved})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {filtered.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#4B5563', fontSize: '13px' }}>
                      Niciun mesaj {contactFilter !== 'all' ? `(${contactFilter === 'open' ? 'deschis' : 'rezolvat'})` : ''}
                    </div>
                  ) : filtered.map(msg => (
                    <div
                      key={msg.id}
                      onClick={() => { setSelectedMsg(msg); setContactNoteText('') }}
                      style={{
                        padding: '13px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: selectedMsg?.id === msg.id ? 'rgba(14,246,255,0.06)' : 'transparent',
                        borderLeft: selectedMsg?.id === msg.id ? '3px solid #0EF6FF' : '3px solid transparent',
                        transition: 'background 0.1s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ color: msg.is_resolved ? '#4B5563' : '#F1F5F9', fontWeight: '600', fontSize: '13px' }}>{msg.name}</span>
                        <span style={{
                          fontSize: '10px', padding: '2px 7px', borderRadius: '20px', fontWeight: '700',
                          background: msg.is_resolved ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)',
                          color: msg.is_resolved ? '#00E676' : '#FF5252',
                          border: `1px solid ${msg.is_resolved ? 'rgba(0,230,118,0.25)' : 'rgba(255,82,82,0.25)'}`,
                        }}>
                          {msg.is_resolved ? 'Rezolvat' : 'Deschis'}
                        </span>
                      </div>
                      <div style={{ color: '#6B7280', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px' }}>{msg.subject}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#374151', fontSize: '11px' }}>{msg.email}</span>
                        <span style={{ color: '#374151', fontSize: '11px' }}>{new Date(msg.created_at).toLocaleDateString('ro-RO')}</span>
                      </div>
                      {(msg.notes?.length > 0) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}>
                          <ChatText size={11} color="#CE93D8" />
                          <span style={{ color: '#CE93D8', fontSize: '10px', fontWeight: '600' }}>{msg.notes.length} {msg.notes.length === 1 ? 'notă' : 'note'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── DETALIU MESAJ ──────────────────────────────── */}
              {!selectedMsg ? (
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#4B5563' }}>
                  <EnvelopeSimple size={40} />
                  <span style={{ fontSize: '14px' }}>Selectează un mesaj din listă</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

                  {/* Message card */}
                  <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                    {/* Msg header */}
                    <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(14,246,255,0.12)', border: '1px solid rgba(14,246,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ color: '#0EF6FF', fontWeight: '800', fontSize: '14px' }}>{selectedMsg.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px' }}>{selectedMsg.name}</div>
                            <div style={{ color: '#6B7280', fontSize: '12px' }}>{selectedMsg.email}</div>
                          </div>
                        </div>
                        <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>{selectedMsg.subject}</div>
                        <div style={{ color: '#4B5563', fontSize: '11px' }}>
                          {new Date(selectedMsg.created_at).toLocaleString('ro-RO')}
                          {selectedMsg.is_resolved && selectedMsg.resolved_by_name && (
                            <span style={{ marginLeft: '12px', color: '#00E676' }}>
                              ✓ Rezolvat de {selectedMsg.resolved_by_name}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Resolve button */}
                      <button
                        onClick={() => handleResolve(selectedMsg)}
                        disabled={contactResolving}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px',
                          borderRadius: '10px', cursor: contactResolving ? 'not-allowed' : 'pointer',
                          fontWeight: '700', fontSize: '13px', flexShrink: 0, transition: 'all 0.15s',
                          background: selectedMsg.is_resolved ? 'rgba(255,82,82,0.12)' : 'rgba(0,230,118,0.12)',
                          color: selectedMsg.is_resolved ? '#FF5252' : '#00E676',
                          border: `1px solid ${selectedMsg.is_resolved ? 'rgba(255,82,82,0.3)' : 'rgba(0,230,118,0.3)'}`,
                        }}
                      >
                        {contactResolving ? <CircleNotch size={14} className="animate-spin" /> : selectedMsg.is_resolved ? <X size={14} /> : <Check size={14} />}
                        {selectedMsg.is_resolved ? 'Redeschide' : 'Marchează rezolvat'}
                      </button>
                    </div>

                    {/* Message body */}
                    <div style={{ padding: '20px 22px' }}>
                      <div style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Mesaj</div>
                      <div style={{ color: '#D1D5DB', fontSize: '14px', lineHeight: '1.75', whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px' }}>
                        {selectedMsg.message}
                      </div>
                    </div>
                  </div>

                  {/* Internal notes */}
                  <div style={{ background: '#0F1923', border: '1px solid rgba(206,147,216,0.2)', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(206,147,216,0.12)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LockKey size={15} color="#CE93D8" />
                      <span style={{ color: '#CE93D8', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Note interne</span>
                      <span style={{ color: '#4B5563', fontSize: '11px' }}>— vizibile doar echipei de suport</span>
                    </div>

                    {/* Notes list */}
                    <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                      {(!selectedMsg.notes || selectedMsg.notes.length === 0) ? (
                        <div style={{ color: '#374151', fontSize: '13px', padding: '8px 0' }}>Nicio notă încă.</div>
                      ) : selectedMsg.notes.map(note => (
                        <div key={note.id} style={{ background: 'rgba(206,147,216,0.06)', border: '1px solid rgba(206,147,216,0.15)', borderRadius: '10px', padding: '11px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ color: '#CE93D8', fontSize: '12px', fontWeight: '700' }}>{note.staff_name}</span>
                            <span style={{ color: '#4B5563', fontSize: '11px' }}>{new Date(note.created_at).toLocaleString('ro-RO')}</span>
                          </div>
                          <p style={{ color: '#D1D5DB', fontSize: '13px', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{note.note_text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Add note */}
                    <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(206,147,216,0.1)', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                      <textarea
                        rows={2}
                        value={contactNoteText}
                        onChange={e => setContactNoteText(e.target.value)}
                        placeholder="Adaugă o notă internă..."
                        style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(206,147,216,0.2)', borderRadius: '8px', padding: '8px 12px', color: '#F1F5F9', fontSize: '13px', resize: 'none', fontFamily: 'inherit' }}
                        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddNote() }}
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={contactNoteSaving || !contactNoteText.trim()}
                        style={{ padding: '9px 16px', borderRadius: '9px', background: contactNoteText.trim() ? 'rgba(206,147,216,0.15)' : 'rgba(255,255,255,0.04)', color: contactNoteText.trim() ? '#CE93D8' : '#4B5563', fontWeight: '700', fontSize: '13px', cursor: contactNoteText.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s', border: `1px solid ${contactNoteText.trim() ? 'rgba(206,147,216,0.3)' : 'transparent'}`, flexShrink: 0 }}
                      >
                        {contactNoteSaving ? <CircleNotch size={14} className="animate-spin" /> : 'Salvează'}
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════
            MARKETING DASHBOARD
        ══════════════════════════════════════════════════════════ */}
        {section === 'marketing_dashboard' && (() => {
          const today          = new Date()
          const activeVouchers = adminVouchers.filter(v => v.is_active)

          // ── Alerte urgente ─────────────────────────────────────────
          const alerts = []

          // campanii expirate (old_price exista, discount_expired = true)
          mktStats.filter(p => p.discount_expired).forEach(p =>
            alerts.push({ type: 'error', icon: '⚠', msg: `Campanie expirată: ${p.name}`, sub: 'Elimină reducerea sau prelungește', action: () => goTo('campanii_mkt') })
          )
          // campanii care expiră în ≤3 zile
          mktStats.filter(p => p.old_price && !p.discount_expired && p.discount_expires_at).forEach(p => {
            const diff = (new Date(p.discount_expires_at) - today) / 86400000
            if (diff >= 0 && diff <= 3)
              alerts.push({ type: 'warn', icon: '⏰', msg: `Expiră în ${Math.ceil(diff)}z: ${p.name}`, sub: `Până la ${new Date(p.discount_expires_at).toLocaleDateString('ro-RO')}`, action: () => goTo('campanii_mkt') })
          })
          // produse cu reducere activă dar stoc 0 — promoție pe ceva indisponibil
          mktStats.filter(p => p.old_price && !p.discount_expired && p.stock === 0).forEach(p =>
            alerts.push({ type: 'warn', icon: '📦', msg: `Promo pe produs fără stoc: ${p.name}`, sub: 'Clienții văd reducerea dar nu pot cumpăra', action: () => goTo('campanii_mkt') })
          )
          // vouchere care expiră în ≤3 zile
          activeVouchers.filter(v => v.expires_at).forEach(v => {
            const diff = (new Date(v.expires_at) - today) / 86400000
            if (diff >= 0 && diff <= 3)
              alerts.push({ type: 'warn', icon: '🎟', msg: `Voucher expiră în ${Math.ceil(diff)}z: ${v.code}`, sub: `${v.type === 'percent' ? v.value+'%' : v.value+' RON'} · folosit de ${v.used_count||0} ori`, action: () => goTo('vouchers') })
          })

          // ── KPI ────────────────────────────────────────────────────
          const activeCampaigns  = mktStats.filter(p => p.old_price && !p.discount_expired)
          const vouchExp3        = activeVouchers.filter(v => { if (!v.expires_at) return false; return (new Date(v.expires_at)-today)/86400000 <= 3 }).length
          const campExp3         = mktStats.filter(p => { if (!p.discount_expires_at || p.discount_expired) return false; return (new Date(p.discount_expires_at)-today)/86400000 <= 3 }).length
          const avgDisc          = activeCampaigns.length
            ? (activeCampaigns.reduce((s,p) => s + Math.round((p.old_price-p.price)/p.old_price*100), 0) / activeCampaigns.length).toFixed(0)
            : 0

          // ── Oportunități: produse cu stoc mare și 0 vânzări ────────
          const opportunities = [...mktStats]
            .filter(p => p.stock >= 10 && p.units_sold === 0 && !p.old_price)
            .sort((a,b) => b.stock - a.stock)
            .slice(0, 6)

          // ── Campanii active sortate după expirare ──────────────────
          const campSummary = [...activeCampaigns]
            .sort((a,b) => {
              if (!a.discount_expires_at) return 1
              if (!b.discount_expires_at) return -1
              return new Date(a.discount_expires_at) - new Date(b.discount_expires_at)
            })
            .slice(0, 7)

          return (
            <div>
              <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Dashboard Marketing</h1>
              <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '20px' }}>Situație campanii, oportunități și alerte</p>

              {/* ── KPI row ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
                {[
                  { label: 'Campanii active',       value: activeCampaigns.length,   color: '#00E676', onClick: () => goTo('campanii_mkt'), sub: `Reducere medie: ${avgDisc}%` },
                  { label: 'Expiră în ≤3 zile',     value: campExp3,                 color: campExp3 ? '#FF5252' : '#4B5563', onClick: campExp3 ? () => goTo('campanii_mkt') : null, sub: campExp3 ? 'Acționează acum!' : 'Nicio campanie urgentă ✓' },
                  { label: 'Vouchere active',        value: activeVouchers.length,    color: '#CE93D8', onClick: () => goTo('vouchers'), sub: vouchExp3 ? `⚠ ${vouchExp3} expiră în 3 zile` : 'Fără urgențe' },
                  { label: 'Alerte totale',          value: alerts.length,            color: alerts.length ? '#FF9800' : '#4B5563', onClick: null, sub: alerts.length ? 'Verifică mai jos' : 'Totul în ordine ✓' },
                ].map(k => (
                  <div key={k.label} onClick={k.onClick} style={{ background: '#0F1923', border: `1px solid ${k.color}33`, borderRadius: '14px', padding: '20px', cursor: k.onClick ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => k.onClick && (e.currentTarget.style.borderColor = k.color+'77')}
                    onMouseLeave={e => k.onClick && (e.currentTarget.style.borderColor = k.color+'33')}>
                    <div style={{ color: k.color, fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{k.label}</div>
                    <div style={{ color: '#F1F5F9', fontSize: '32px', fontWeight: '800', lineHeight: 1 }}>{k.value}</div>
                    <div style={{ color: '#4B5563', fontSize: '11px', marginTop: '5px' }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* ── Alerte urgente ── */}
              {alerts.length > 0 && (
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,152,0,0.2)', borderRadius: '14px', overflow: 'hidden', marginBottom: '20px' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#FF9800', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>⚡ Alerte urgente</span>
                    <span style={{ color: '#4B5563', fontSize: '11px' }}>{alerts.length} elemente</span>
                  </div>
                  <div style={{ padding: '8px 0' }}>
                    {alerts.map((a, i) => (
                      <div key={i} onClick={a.action} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 18px', borderBottom: i < alerts.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>{a.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: a.type === 'error' ? '#FF5252' : '#F1F5F9', fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.msg}</div>
                          <div style={{ color: '#4B5563', fontSize: '11px' }}>{a.sub}</div>
                        </div>
                        <span style={{ color: '#0EF6FF', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>Rezolvă →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* ── Oportunități promoție ── */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Oportunități promoție</span>
                    <button onClick={() => { setCampTab('all'); goTo('campanii_mkt') }} style={{ background: 'transparent', border: 'none', color: '#0EF6FF', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Aplică →</button>
                  </div>
                  <p style={{ color: '#4B5563', fontSize: '11px', marginBottom: '14px' }}>Produse cu stoc ≥10 și 0 vânzări — candidați pentru campanie</p>
                  {opportunities.length === 0 ? (
                    <div style={{ color: '#4B5563', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nu există produse blocate în stoc ✓</div>
                  ) : opportunities.map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < opportunities.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ color: '#4B5563', fontSize: '11px' }}>{p.category} · {p.price.toFixed(0)} RON</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ color: '#FF9800', fontSize: '12px', fontWeight: '700' }}>{p.stock} în stoc</div>
                        <div style={{ color: '#4B5563', fontSize: '10px' }}>0 vânzări</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Campanii active — sumar ── */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Campanii active</span>
                    <button onClick={() => goTo('campanii_mkt')} style={{ background: 'transparent', border: 'none', color: '#0EF6FF', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Toate →</button>
                  </div>
                  {campSummary.length === 0 ? (
                    <div style={{ color: '#4B5563', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Nicio campanie activă.</div>
                  ) : campSummary.map((p, i) => {
                    const discPct = Math.round((p.old_price - p.price) / p.old_price * 100)
                    const expDate = p.discount_expires_at ? new Date(p.discount_expires_at) : null
                    const daysLeft = expDate ? Math.ceil((expDate - today) / 86400000) : null
                    return (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < campSummary.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div style={{ color: '#4B5563', fontSize: '11px' }}>{p.category}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ background: 'rgba(255,210,0,0.12)', color: '#FFD700', borderRadius: '5px', padding: '2px 6px', fontSize: '11px', fontWeight: '700' }}>-{discPct}%</span>
                          <div style={{ color: daysLeft === null ? '#4B5563' : daysLeft <= 3 ? '#FF5252' : daysLeft <= 7 ? '#FF9800' : '#6B7280', fontSize: '10px', marginTop: '3px', fontWeight: daysLeft !== null && daysLeft <= 7 ? '700' : '400' }}>
                            {daysLeft === null ? '∞ permanentă' : `${daysLeft}z rămase`}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Trend venituri + Top produse ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Mini AreaChart venituri 7 zile */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '14px' }}>Venituri — ultimele 7 zile</span>
                    <button onClick={() => goTo('grafice_mkt')} style={{ background: 'transparent', border: 'none', color: '#0EF6FF', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Grafice →</button>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={revenue7.map(d => ({ zi: d.day, Venituri: Math.round(d.val) }))} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="mktRevGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00E676" stopOpacity={0.25} /><stop offset="95%" stopColor="#00E676" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="zi" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? v : ''} width={55} />
                      <Tooltip contentStyle={{ background: '#0D1421', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F1F5F9', fontSize: '11px' }} labelStyle={{ color: '#9CA3AF' }} formatter={v => [v + ' RON', 'Venituri']} />
                      <Area type="monotone" dataKey="Venituri" stroke="#00E676" strokeWidth={2} fill="url(#mktRevGrad)" dot={{ fill: '#00E676', r: 3 }} activeDot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Top 5 produse by units sold */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '14px' }}>Top 5 produse — unități vândute</span>
                    <button onClick={() => goTo('produse_mkt')} style={{ background: 'transparent', border: 'none', color: '#0EF6FF', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Toate →</button>
                  </div>
                  {(() => {
                    const top5mkt = [...mktStats].sort((a,b) => b.units_sold - a.units_sold).slice(0,5)
                    const maxUnits = top5mkt[0]?.units_sold || 1
                    if (top5mkt.length === 0) return <p style={{ color: '#4B5563', fontSize: '13px' }}>Nu există date de vânzări.</p>
                    return top5mkt.map((p, i) => (
                      <div key={p.id} style={{ marginBottom: i < top5mkt.length - 1 ? '12px' : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#F1F5F9', fontSize: '11px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{p.name}</span>
                          <span style={{ color: '#9CA3AF', fontSize: '11px', flexShrink: 0, marginLeft: '8px' }}>{p.units_sold} buc</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(p.units_sold / maxUnits) * 100}%`, background: ['#0EF6FF','#00E676','#CE93D8','#42A5F5','#FFD700'][i], borderRadius: '2px' }} />
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </div>

              {/* ── Vouchere — focus expirare ── */}
              <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Vouchere active</span>
                  <button onClick={() => goTo('vouchers')} style={{ background: 'transparent', border: 'none', color: '#0EF6FF', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Gestionează →</button>
                </div>
                {activeVouchers.length === 0 ? (
                  <div style={{ padding: '24px', color: '#4B5563', fontSize: '13px', textAlign: 'center' }}>Nu există vouchere active.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['Cod','Valoare','Utilizări','Expiră','Stare'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {[...activeVouchers].sort((a,b) => {
                        if (!a.expires_at) return 1; if (!b.expires_at) return -1
                        return new Date(a.expires_at) - new Date(b.expires_at)
                      }).map(v => {
                        const daysLeft = v.expires_at ? Math.ceil((new Date(v.expires_at)-today)/86400000) : null
                        const usagePct = v.usage_limit ? Math.round((v.used_count||0)/v.usage_limit*100) : null
                        const urgent = daysLeft !== null && daysLeft <= 3
                        return (
                          <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                            <td style={{ ...td, color: '#0EF6FF', fontFamily: 'monospace', fontWeight: '700' }}>{v.code}</td>
                            <td style={{ ...td, color: '#F1F5F9', fontWeight: '600' }}>{v.type === 'percent' ? v.value+'%' : v.type === 'fixed' ? v.value+' RON' : 'Transport gratuit'}</td>
                            <td style={td}>
                              <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{v.used_count||0}{v.usage_limit ? `/${v.usage_limit}` : ''}</span>
                              {usagePct !== null && (
                                <div style={{ marginTop: '3px', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', width: '60px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${usagePct}%`, background: usagePct >= 80 ? '#FF5252' : '#00E676', borderRadius: '2px' }} />
                                </div>
                              )}
                            </td>
                            <td style={td}>
                              {daysLeft === null
                                ? <span style={{ color: '#4B5563', fontSize: '11px' }}>Fără expirare</span>
                                : <span style={{ color: urgent ? '#FF5252' : daysLeft <= 7 ? '#FF9800' : '#6B7280', fontSize: '11px', fontWeight: urgent ? '700' : '400' }}>
                                    {new Date(v.expires_at).toLocaleDateString('ro-RO')}
                                  </span>}
                            </td>
                            <td style={td}>
                              {urgent
                                ? <span style={{ background: 'rgba(255,82,82,0.12)', color: '#FF5252', borderRadius: '5px', padding: '2px 7px', fontSize: '10px', fontWeight: '700' }}>URGENT</span>
                                : daysLeft !== null && daysLeft <= 7
                                  ? <span style={{ background: 'rgba(255,152,0,0.12)', color: '#FF9800', borderRadius: '5px', padding: '2px 7px', fontSize: '10px', fontWeight: '700' }}>în {daysLeft}z</span>
                                  : <span style={{ color: '#00E676', fontSize: '11px' }}>OK</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════
            PRODUSE & PERFORMANȚĂ (MARKETING)
        ══════════════════════════════════════════════════════════ */}
        {section === 'produse_mkt' && (() => {
          // Sortare + filtre
          const cats = [...new Set(mktStats.map(p => p.category))].sort()
          let filtered = mktStats.filter(p => {
            if (mktCatFilter && p.category !== mktCatFilter) return false
            if (mktRatingMin !== '' && p.avg_rating < parseFloat(mktRatingMin)) return false
            if (mktRatingMax !== '' && p.avg_rating > parseFloat(mktRatingMax)) return false
            if (mktSearch && !p.name.toLowerCase().includes(mktSearch.toLowerCase()) && !p.brand?.toLowerCase().includes(mktSearch.toLowerCase())) return false
            return true
          })
          filtered = [...filtered].sort((a, b) => {
            switch (mktSort) {
              case 'units_sold_desc': return b.units_sold - a.units_sold
              case 'units_sold_asc':  return a.units_sold - b.units_sold
              case 'rating_desc':     return b.avg_rating - a.avg_rating
              case 'rating_asc':      return a.avg_rating - b.avg_rating
              case 'price_desc':      return b.price - a.price
              case 'price_asc':       return a.price - b.price
              case 'revenue_desc':    return b.revenue - a.revenue
              default: return 0
            }
          })

          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div>
                  <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Produse & Performanță</h1>
                  <p style={{ color: '#4B5563', fontSize: '13px' }}>{filtered.length} produse afișate din {mktStats.length}</p>
                </div>
                <button onClick={() => exportCSV(filtered.map(p => ({
                  Produs: p.name, Brand: p.brand, Categorie: p.category,
                  'Pret RON': p.price, 'Pret vechi RON': p.old_price || '',
                  Stoc: p.stock, 'Unitati vandute': p.units_sold,
                  'Venituri RON': p.revenue.toFixed(2), 'Rating mediu': p.avg_rating,
                  'Nr recenzii': p.review_count,
                })), 'produse-performanta.csv')}
                  style={{ background: 'rgba(14,246,255,0.08)', border: '1px solid rgba(14,246,255,0.2)', color: '#0EF6FF', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  ↓ Export CSV
                </button>
              </div>

              {/* Filtre */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <MagnifyingGlass size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
                  <input value={mktSearch} onChange={e => setMktSearch(e.target.value)} placeholder="Caută produs..."
                    style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 10px 7px 28px', color: '#F1F5F9', fontSize: '12px', width: '200px' }} />
                </div>
                {/* Sortare */}
                <select value={mktSort} onChange={e => setMktSort(e.target.value)}
                  style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 10px', color: '#F1F5F9', fontSize: '12px', cursor: 'pointer' }}>
                  <option value="units_sold_desc">Cele mai vândute ↓</option>
                  <option value="units_sold_asc">Cele mai puțin vândute ↑</option>
                  <option value="rating_desc">Rating ↓</option>
                  <option value="rating_asc">Rating ↑</option>
                  <option value="revenue_desc">Venituri ↓</option>
                  <option value="price_desc">Preț ↓</option>
                  <option value="price_asc">Preț ↑</option>
                </select>
                {/* Categorie */}
                <select value={mktCatFilter} onChange={e => setMktCatFilter(e.target.value)}
                  style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 10px', color: mktCatFilter ? '#F1F5F9' : '#6B7280', fontSize: '12px', cursor: 'pointer' }}>
                  <option value="">Toate categoriile</option>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {/* Rating min */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#6B7280', fontSize: '12px' }}>Rating</span>
                  <select value={mktRatingMin} onChange={e => setMktRatingMin(e.target.value)}
                    style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 8px', color: mktRatingMin ? '#F1F5F9' : '#6B7280', fontSize: '12px', cursor: 'pointer' }}>
                    <option value="">min</option>
                    {[1,2,3,4,5].map(s => <option key={s} value={s}>{s}★</option>)}
                  </select>
                  <span style={{ color: '#4B5563', fontSize: '12px' }}>—</span>
                  <select value={mktRatingMax} onChange={e => setMktRatingMax(e.target.value)}
                    style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 8px', color: mktRatingMax ? '#F1F5F9' : '#6B7280', fontSize: '12px', cursor: 'pointer' }}>
                    <option value="">max</option>
                    {[1,2,3,4,5].map(s => <option key={s} value={s}>{s}★</option>)}
                  </select>
                </div>
                {(mktSearch || mktCatFilter || mktRatingMin || mktRatingMax) && (
                  <button onClick={() => { setMktSearch(''); setMktCatFilter(''); setMktRatingMin(''); setMktRatingMax('') }}
                    style={{ background: 'transparent', border: '1px solid rgba(255,82,82,0.3)', color: '#FF5252', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                    <X size={11} style={{ display: 'inline', marginRight: '4px' }} />Resetează filtre
                  </button>
                )}
              </div>

              {/* Tabel */}
              <div style={{ ...tableWrap, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Produs','Categorie','Vândute','Venituri','Rating','Recenzii','Stoc','Preț','Reducere'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={9} style={{ ...td, textAlign: 'center', color: '#4B5563', padding: '40px' }}>Niciun produs nu corespunde filtrelor.</td></tr>
                    ) : filtered.map(p => {
                      const today = new Date()
                      const expDate = p.discount_expires_at ? new Date(p.discount_expires_at) : null
                      const expired = expDate && expDate < today
                      const daysLeft = expDate && !expired ? Math.ceil((expDate - today)/86400000) : null
                      return (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors" style={{ position: 'relative' }}>
                          <td style={td}>
                            <div style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                            <div style={{ color: '#4B5563', fontSize: '11px' }}>{p.brand}</div>
                          </td>
                          <td style={{ ...td, color: '#9CA3AF', fontSize: '12px' }}>{p.category}</td>
                          <td style={{ ...td, textAlign: 'center' }}>
                            <span style={{ color: p.units_sold > 0 ? '#00E676' : '#4B5563', fontWeight: '700', fontSize: '13px' }}>{p.units_sold}</span>
                          </td>
                          <td style={{ ...td, color: '#FFD700', fontWeight: '600', fontSize: '12px' }}>{p.revenue > 0 ? p.revenue.toFixed(0)+' RON' : '—'}</td>
                          <td style={{ ...td, textAlign: 'center' }}>
                            {p.avg_rating > 0
                              ? <span style={{ color: p.avg_rating >= 4 ? '#00E676' : p.avg_rating >= 3 ? '#FFD700' : '#FF5252', fontWeight: '700' }}>{p.avg_rating}★</span>
                              : <span style={{ color: '#4B5563', fontSize: '11px' }}>—</span>}
                          </td>
                          <td style={{ ...td, color: '#6B7280', fontSize: '12px', textAlign: 'center' }}>{p.review_count || '—'}</td>
                          <td style={{ ...td, textAlign: 'center' }}>
                            <span style={{ color: p.stock === 0 ? '#FF5252' : p.stock < 5 ? '#FF9800' : '#6B7280', fontWeight: p.stock < 5 ? '700' : '400', fontSize: '12px' }}>{p.stock}</span>
                          </td>
                          <td style={td}>
                            <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '13px' }}>{p.price} RON</div>
                            {p.old_price && <div style={{ color: '#4B5563', fontSize: '11px', textDecoration: 'line-through' }}>{p.old_price} RON</div>}
                            {p.old_price && (
                              <div style={{ color: expired ? '#FF5252' : daysLeft !== null && daysLeft <= 3 ? '#FF9800' : '#00E676', fontSize: '10px', fontWeight: '700' }}>
                                {expired ? '⚠ Expirat' : daysLeft !== null ? `${daysLeft}z` : '∞'}
                              </div>
                            )}
                          </td>
                          <td style={{ ...td, textAlign: 'center' }}>
                            {p.old_price ? (
                              <button onClick={() => handleRemoveDiscount(p)}
                                style={{ background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)', color: '#FF5252', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                                <X size={10} style={{ display: 'inline', marginRight: '3px' }} />Elimină
                              </button>
                            ) : (
                              <button onClick={() => { setDiscountTarget(p); setDiscountType('percent'); setDiscountValue(''); setDiscountExpiry('') }}
                                style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                                % Reducere
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Modal discount */}
              {discountTarget && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={e => { if (e.target === e.currentTarget) setDiscountTarget(null) }}>
                  <div style={{ background: '#0D1421', borderRadius: '18px', border: '1px solid rgba(255,215,0,0.25)', padding: '28px', width: '420px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
                    <h3 style={{ color: '#F1F5F9', fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Aplică reducere</h3>
                    <p style={{ color: '#6B7280', fontSize: '12px', marginBottom: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{discountTarget.name}</p>

                    {/* Tip reducere */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      {[['percent','% Procent'],['fixed','Lei (RON)']].map(([val, lbl]) => (
                        <button key={val} onClick={() => { setDiscountType(val); setDiscountValue('') }}
                          style={{ flex: 1, padding: '9px', borderRadius: '9px', border: `1px solid ${discountType === val ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`, background: discountType === val ? 'rgba(255,215,0,0.1)' : 'transparent', color: discountType === val ? '#FFD700' : '#6B7280', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }}>
                          {lbl}
                        </button>
                      ))}
                    </div>

                    {/* Input valoare */}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {discountType === 'percent' ? 'Procent reducere (1–99%)' : 'Sumă reducere (RON)'}
                      </label>
                      <input type="number" min="0" max={discountType === 'percent' ? 99 : undefined}
                        value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                        placeholder={discountType === 'percent' ? 'ex: 15' : 'ex: 50'}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '9px', padding: '9px 12px', color: '#F1F5F9', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>

                    {/* Preview pret */}
                    {discountValue && (
                      <div style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: '#4B5563', fontSize: '11px', textDecoration: 'line-through' }}>{(discountTarget.old_price || discountTarget.price).toFixed(2)} RON</div>
                          <div style={{ color: '#00E676', fontSize: '18px', fontWeight: '800' }}>{discountPreviewPrice()} RON</div>
                        </div>
                        {discountType === 'percent' && <div style={{ color: '#FFD700', fontSize: '22px', fontWeight: '800' }}>-{discountValue}%</div>}
                      </div>
                    )}

                    {/* Expirare */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Expiră la (opțional)
                      </label>
                      <input type="date" value={discountExpiry} onChange={e => setDiscountExpiry(e.target.value)} min={new Date().toISOString().split('T')[0]}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', padding: '9px 12px', color: discountExpiry ? '#F1F5F9' : '#4B5563', fontSize: '13px', boxSizing: 'border-box', colorScheme: 'dark' }} />
                      {!discountExpiry && <div style={{ color: '#4B5563', fontSize: '11px', marginTop: '4px' }}>Fără dată → reducere permanentă până la modificare manuală</div>}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setDiscountTarget(null)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#6B7280', padding: '9px 18px', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Anulează</button>
                      <button onClick={handleApplyDiscount} disabled={discountSaving || !discountValue}
                        style={{ background: discountValue ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${discountValue ? 'rgba(255,215,0,0.4)' : 'transparent'}`, color: discountValue ? '#FFD700' : '#4B5563', padding: '9px 20px', borderRadius: '9px', cursor: discountValue ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {discountSaving ? <CircleNotch size={14} className="animate-spin" /> : <Tag size={14} />}
                        Aplică reducerea
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════
            GRAFICE & ANALIZE (MARKETING)
        ══════════════════════════════════════════════════════════ */}
        {section === 'grafice_mkt' && (() => {
          const activeVouchers = adminVouchers.filter(v => v.is_active)

          // A — Venituri pe categorie
          const CAT_COLORS = ['#0EF6FF','#CE93D8','#00E676','#FFD700','#FF9800','#FF5252','#42A5F5','#4FC3F7','#80CBC4','#F48FB1']
          const revByCategory = Object.values(
            mktStats.reduce((acc, p) => {
              if (!acc[p.category]) acc[p.category] = { name: p.category || 'Fără categorie', value: 0 }
              acc[p.category].value += p.revenue
              return acc
            }, {})
          ).filter(c => c.value > 0).sort((a,b) => b.value - a.value)

          // B — Top 8 după venituri
          const top8Rev = [...mktStats].sort((a,b) => b.revenue - a.revenue).slice(0, 8)
            .map(p => ({ name: p.name.length > 28 ? p.name.slice(0,28)+'…' : p.name, revenue: parseFloat(p.revenue.toFixed(0)) }))

          // C — Sănătate stoc pe categorie
          const stockByCat = Object.values(
            mktStats.reduce((acc, p) => {
              const cat = p.category || 'Fără categorie'
              if (!acc[cat]) acc[cat] = { name: cat, ok: 0, redus: 0, zero: 0 }
              if (p.stock === 0) acc[cat].zero++
              else if (p.stock <= 5) acc[cat].redus++
              else acc[cat].ok++
              return acc
            }, {})
          ).sort((a,b) => (b.zero+b.redus) - (a.zero+a.redus))

          // D — Utilizare vouchere
          const voucherUsage = activeVouchers
            .filter(v => v.usage_limit && v.usage_limit > 0)
            .map(v => ({ code: v.code, pct: Math.round(((v.used_count||0)/v.usage_limit)*100), used: v.used_count||0, limit: v.usage_limit }))
            .sort((a,b) => b.pct - a.pct)

          // E — Venituri în timp
          const periodLabel = { day: 'Zilnic', week: 'Săptămânal', month: 'Lunar' }
          const fmtDate = (d) => {
            if (!d) return ''
            const dt = new Date(d)
            if (revPeriod === 'month') return dt.toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' })
            return dt.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })
          }
          const chartData = revTimeline.map(r => ({ date: fmtDate(r.date), revenue: r.revenue }))

          return (
            <div>
              <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Grafice & Analize</h1>
              <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '24px' }}>Vizualizări detaliate pentru performanța magazinului</p>

              {/* E — Venituri în timp */}
              <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Venituri în timp</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['day','week','month'].map(p => (
                      <button key={p} onClick={() => handleRevPeriodChange(p)}
                        style={{ background: revPeriod === p ? 'rgba(14,246,255,0.15)' : 'transparent', border: `1px solid ${revPeriod === p ? '#0EF6FF' : 'rgba(255,255,255,0.1)'}`, borderRadius: '6px', padding: '4px 10px', color: revPeriod === p ? '#0EF6FF' : '#6B7280', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                        {periodLabel[p]}
                      </button>
                    ))}
                  </div>
                </div>
                {chartData.length === 0 ? (
                  <div style={{ color: '#4B5563', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Nu există date de venituri.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0EF6FF" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#0EF6FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="date" tick={{ fill: '#4B5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#4B5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v} width={42} />
                      <Tooltip contentStyle={{ background: '#0F1923', border: '1px solid rgba(14,246,255,0.2)', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: '#9CA3AF' }} formatter={v => [v.toFixed(2)+' RON', 'Venituri']} />
                      <Area type="monotone" dataKey="revenue" stroke="#0EF6FF" strokeWidth={2} fill="url(#revGrad2)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* A+B — Venituri pe categorie + Top produse după venituri */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Venituri pe categorie</div>
                  {revByCategory.length === 0 ? (
                    <div style={{ color: '#4B5563', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Nu există date.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={revByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                          {revByCategory.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} formatter={v => [v.toFixed(2)+' RON', 'Venituri']} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#9CA3AF' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Top 8 produse după venituri</div>
                  {top8Rev.length === 0 ? (
                    <div style={{ color: '#4B5563', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Nu există date.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={top8Rev} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#4B5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v} />
                        <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} width={130} />
                        <Tooltip contentStyle={{ background: '#0F1923', border: '1px solid rgba(206,147,216,0.2)', borderRadius: '8px', fontSize: '12px' }} formatter={v => [v.toFixed(2)+' RON', 'Venituri']} />
                        <Bar dataKey="revenue" fill="#CE93D8" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* C+D — Stoc pe categorie + Utilizare vouchere */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Sănătate stoc pe categorie</div>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    {[['#00E676','Stoc OK'],['#FFD700','Stoc redus ≤5'],['#FF5252','Zero stoc']].map(([c,l]) => (
                      <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#6B7280' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: c, display: 'inline-block' }} />{l}
                      </span>
                    ))}
                  </div>
                  {stockByCat.length === 0 ? (
                    <div style={{ color: '#4B5563', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Nu există date.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stockByCat} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#4B5563', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
                        <Bar dataKey="ok" stackId="s" fill="#00E676" name="Stoc OK" />
                        <Bar dataKey="redus" stackId="s" fill="#FFD700" name="Stoc redus ≤5" />
                        <Bar dataKey="zero" stackId="s" fill="#FF5252" name="Zero stoc" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Rata utilizare vouchere (%)</div>
                  {voucherUsage.length === 0 ? (
                    <div style={{ color: '#4B5563', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Nu există vouchere cu limită de utilizare.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {voucherUsage.map(v => (
                        <div key={v.code}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: '#0EF6FF', fontSize: '11px', fontWeight: '700', fontFamily: 'monospace' }}>{v.code}</span>
                            <span style={{ color: '#6B7280', fontSize: '11px' }}>{v.used}/{v.limit} ({v.pct}%)</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${v.pct}%`, background: v.pct >= 90 ? '#FF5252' : v.pct >= 60 ? '#FFD700' : '#00E676', borderRadius: '3px', transition: 'width 0.4s' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════
            CAMPANII PRODUSE (MARKETING)
        ══════════════════════════════════════════════════════════ */}
        {section === 'campanii_mkt' && (() => {
          const today = new Date()
          const todayStr = today.toISOString().split('T')[0]

          const allPromo = mktStats.filter(p => p.old_price)
          const activePromo = allPromo.filter(p => !p.discount_expired)
          const expiredPromo = allPromo.filter(p => p.discount_expired)
          const expiringSoon = activePromo.filter(p => {
            if (!p.discount_expires_at) return false
            const diff = (new Date(p.discount_expires_at) - today) / 86400000
            return diff >= 0 && diff <= 7
          })
          const permanent = activePromo.filter(p => !p.discount_expires_at)

          const campSearch = mktSearch
          const cats = [...new Set(mktStats.map(p => p.category))].sort()

          // lista afisata in functie de tab
          const listSource = campTab === 'active'
            ? activePromo
            : mktStats.filter(p => !p.old_price)

          const filtered = listSource.filter(p => {
            if (mktCatFilter && p.category !== mktCatFilter) return false
            if (campSearch && !p.name.toLowerCase().includes(campSearch.toLowerCase()) && !p.brand?.toLowerCase().includes(campSearch.toLowerCase())) return false
            return true
          })

          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Campanii Produse</h1>
                  <p style={{ color: '#4B5563', fontSize: '13px' }}>Gestionează reducerile active și aplică promoții noi</p>
                </div>
                <button onClick={() => exportCSV(activePromo.map(p => ({
                  Produs: p.name, Categorie: p.category,
                  'Pret original RON': p.old_price?.toFixed(2) || '',
                  'Pret redus RON': p.price.toFixed(2),
                  'Reducere %': Math.round((p.old_price-p.price)/p.old_price*100),
                  'Reducere RON': (p.old_price-p.price).toFixed(2),
                  'Expira la': p.discount_expires_at ? new Date(p.discount_expires_at).toLocaleDateString('ro-RO') : 'Permanenta',
                  Stoc: p.stock,
                })), 'campanii-active.csv')}
                  style={{ background: 'rgba(14,246,255,0.08)', border: '1px solid rgba(14,246,255,0.2)', color: '#0EF6FF', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  ↓ Export campanii CSV
                </button>
              </div>

              {/* KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {[
                  { label: 'Promoții active',      value: activePromo.length,    color: '#00E676', sub: `${permanent.length} permanente` },
                  { label: 'Expiră în 7 zile',     value: expiringSoon.length,   color: '#FF9800', sub: expiringSoon.length ? 'Atenție!' : 'Totul OK ✓' },
                  { label: 'Expirate (neeliminate)', value: expiredPromo.length, color: '#FF5252', sub: expiredPromo.length ? 'Necesită curățare' : 'Totul curat ✓' },
                  { label: 'Fără reducere',         value: mktStats.filter(p => !p.old_price).length, color: '#CE93D8', sub: 'Disponibile pentru promoție' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#0F1923', border: `1px solid ${k.color}33`, borderRadius: '14px', padding: '20px' }}>
                    <div style={{ color: k.color, fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{k.label}</div>
                    <div style={{ color: '#F1F5F9', fontSize: '32px', fontWeight: '800', lineHeight: 1 }}>{k.value}</div>
                    <div style={{ color: '#4B5563', fontSize: '11px', marginTop: '5px' }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* Tab toggle + filtre */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '3px', gap: '2px', marginRight: '6px' }}>
                  {[['active','Promoții active'],['all','Adaugă promoție']].map(([val, lbl]) => (
                    <button key={val} onClick={() => { setCampTab(val); setMktSearch(''); setMktCatFilter('') }}
                      style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: campTab === val ? 'rgba(14,246,255,0.12)' : 'transparent', color: campTab === val ? '#0EF6FF' : '#6B7280', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
                {/* Search */}
                <div style={{ position: 'relative' }}>
                  <MagnifyingGlass size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
                  <input value={mktSearch} onChange={e => setMktSearch(e.target.value)} placeholder="Caută produs..."
                    style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 10px 7px 28px', color: '#F1F5F9', fontSize: '12px', width: '200px' }} />
                </div>
                {/* Categorie */}
                <select value={mktCatFilter} onChange={e => setMktCatFilter(e.target.value)}
                  style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '7px 10px', color: mktCatFilter ? '#F1F5F9' : '#6B7280', fontSize: '12px', cursor: 'pointer' }}>
                  <option value="">Toate categoriile</option>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {(mktSearch || mktCatFilter) && (
                  <button onClick={() => { setMktSearch(''); setMktCatFilter('') }}
                    style={{ background: 'transparent', border: '1px solid rgba(255,82,82,0.3)', color: '#FF5252', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                    <X size={11} style={{ display: 'inline', marginRight: '4px' }} />Resetează
                  </button>
                )}
              </div>

              {/* Tabel */}
              <div style={{ ...tableWrap, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {campTab === 'active'
                        ? ['Produs','Categorie','Preț vechi','Preț nou','Reducere','Durată','Acțiuni'].map(h => <th key={h} style={th}>{h}</th>)
                        : ['Produs','Categorie','Preț curent','Vândute','Rating','Aplică reducere'].map(h => <th key={h} style={th}>{h}</th>)
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: '#4B5563', padding: '40px' }}>
                        {campTab === 'active' ? 'Nu există promoții active.' : 'Niciun produs fără reducere găsit.'}
                      </td></tr>
                    ) : campTab === 'active' ? filtered.map(p => {
                      const expDate = p.discount_expires_at ? new Date(p.discount_expires_at) : null
                      const expired = expDate && expDate < today
                      const daysLeft = expDate && !expired ? Math.ceil((expDate - today)/86400000) : null
                      const discPct = p.old_price ? Math.round((p.old_price - p.price) / p.old_price * 100) : 0
                      const discRon = p.old_price ? (p.old_price - p.price).toFixed(2) : null
                      return (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                          <td style={td}>
                            <div style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                            <div style={{ color: '#4B5563', fontSize: '11px' }}>{p.brand}</div>
                          </td>
                          <td style={{ ...td, color: '#9CA3AF', fontSize: '12px' }}>{p.category}</td>
                          <td style={{ ...td, color: '#6B7280', textDecoration: 'line-through', fontSize: '12px' }}>{p.old_price?.toFixed(2)} RON</td>
                          <td style={{ ...td, color: '#00E676', fontWeight: '700' }}>{p.price.toFixed(2)} RON</td>
                          <td style={td}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ background: 'rgba(255,210,0,0.12)', color: '#FFD700', borderRadius: '5px', padding: '2px 7px', fontSize: '11px', fontWeight: '700', display: 'inline-block' }}>-{discPct}%</span>
                              <span style={{ color: '#4B5563', fontSize: '10px' }}>-{discRon} RON</span>
                            </div>
                          </td>
                          <td style={td}>
                            {!expDate
                              ? <span style={{ color: '#6B7280', fontSize: '11px' }}>∞ Permanentă</span>
                              : expired
                                ? <span style={{ color: '#FF5252', fontSize: '11px', fontWeight: '700' }}>⚠ Expirată</span>
                                : <span style={{ color: daysLeft <= 3 ? '#FF5252' : daysLeft <= 7 ? '#FF9800' : '#6B7280', fontSize: '11px', fontWeight: daysLeft <= 7 ? '700' : '400' }}>
                                    {new Date(p.discount_expires_at).toLocaleDateString('ro-RO')} ({daysLeft}z)
                                  </span>
                            }
                          </td>
                          <td style={{ ...td, whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => { setDiscountTarget(p); setDiscountType('percent'); setDiscountValue(''); setDiscountExpiry(p.discount_expires_at ? p.discount_expires_at.split('T')[0] : '') }}
                                style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                                <PencilSimple size={11} style={{ display: 'inline', marginRight: '3px' }} />Modifică
                              </button>
                              <button onClick={() => handleRemoveDiscount(p)}
                                style={{ background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)', color: '#FF5252', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                                <X size={10} style={{ display: 'inline', marginRight: '3px' }} />Elimină
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    }) : filtered.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td style={td}>
                          <div style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '13px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div style={{ color: '#4B5563', fontSize: '11px' }}>{p.brand}</div>
                        </td>
                        <td style={{ ...td, color: '#9CA3AF', fontSize: '12px' }}>{p.category}</td>
                        <td style={{ ...td, color: '#F1F5F9', fontWeight: '700' }}>{p.price.toFixed(2)} RON</td>
                        <td style={{ ...td, color: p.units_sold > 0 ? '#00E676' : '#4B5563', fontWeight: '700', textAlign: 'center' }}>{p.units_sold}</td>
                        <td style={{ ...td, textAlign: 'center' }}>
                          {p.avg_rating > 0 ? <span style={{ color: p.avg_rating >= 4 ? '#00E676' : p.avg_rating >= 3 ? '#FFD700' : '#FF5252', fontWeight: '700' }}>{p.avg_rating}★</span> : <span style={{ color: '#4B5563' }}>—</span>}
                        </td>
                        <td style={{ ...td, textAlign: 'center' }}>
                          <button onClick={() => { setDiscountTarget(p); setDiscountType('percent'); setDiscountValue(''); setDiscountExpiry('') }}
                            style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#FFD700', borderRadius: '7px', padding: '5px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                            <Tag size={11} style={{ display: 'inline', marginRight: '4px' }} />Aplică reducere
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal discount */}
              {discountTarget && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={e => { if (e.target === e.currentTarget) setDiscountTarget(null) }}>
                  <div style={{ background: '#0D1421', borderRadius: '18px', border: '1px solid rgba(255,215,0,0.25)', padding: '28px', width: '420px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
                    <h3 style={{ color: '#F1F5F9', fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
                      {discountTarget.old_price ? 'Modifică reducere' : 'Aplică reducere'}
                    </h3>
                    <p style={{ color: '#6B7280', fontSize: '12px', marginBottom: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{discountTarget.name}</p>

                    {/* Tip reducere */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      {[['percent','% Procent'],['fixed','Lei (RON)']].map(([val, lbl]) => (
                        <button key={val} onClick={() => { setDiscountType(val); setDiscountValue('') }}
                          style={{ flex: 1, padding: '9px', borderRadius: '9px', border: `1px solid ${discountType === val ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.08)'}`, background: discountType === val ? 'rgba(255,215,0,0.1)' : 'transparent', color: discountType === val ? '#FFD700' : '#6B7280', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s' }}>
                          {lbl}
                        </button>
                      ))}
                    </div>

                    {/* Input valoare */}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {discountType === 'percent' ? 'Procent reducere (1–99%)' : 'Sumă reducere (RON)'}
                      </label>
                      <input type="number" min="0" max={discountType === 'percent' ? 99 : undefined}
                        value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                        placeholder={discountType === 'percent' ? 'ex: 15' : 'ex: 50'}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '9px', padding: '9px 12px', color: '#F1F5F9', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>

                    {/* Preview pret */}
                    {discountValue && (
                      <div style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ color: '#4B5563', fontSize: '11px', textDecoration: 'line-through' }}>{(discountTarget.old_price || discountTarget.price).toFixed(2)} RON</div>
                          <div style={{ color: '#00E676', fontSize: '18px', fontWeight: '800' }}>{discountPreviewPrice()} RON</div>
                        </div>
                        {discountType === 'percent' && <div style={{ color: '#FFD700', fontSize: '22px', fontWeight: '800' }}>-{discountValue}%</div>}
                        {discountType === 'fixed' && discountValue && <div style={{ color: '#FFD700', fontSize: '16px', fontWeight: '800' }}>-{discountValue} RON</div>}
                      </div>
                    )}

                    {/* Expirare */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Durată campanie
                      </label>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                        <button onClick={() => setDiscountExpiry('')}
                          style={{ flex: 1, padding: '7px', borderRadius: '8px', border: `1px solid ${!discountExpiry ? 'rgba(0,230,118,0.4)' : 'rgba(255,255,255,0.08)'}`, background: !discountExpiry ? 'rgba(0,230,118,0.08)' : 'transparent', color: !discountExpiry ? '#00E676' : '#6B7280', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                          ∞ Permanentă
                        </button>
                        <button onClick={() => { if (!discountExpiry) setDiscountExpiry(new Date(Date.now()+7*86400000).toISOString().split('T')[0]) }}
                          style={{ flex: 1, padding: '7px', borderRadius: '8px', border: `1px solid ${discountExpiry ? 'rgba(255,152,0,0.4)' : 'rgba(255,255,255,0.08)'}`, background: discountExpiry ? 'rgba(255,152,0,0.08)' : 'transparent', color: discountExpiry ? '#FF9800' : '#6B7280', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                          📅 Cu dată expirare
                        </button>
                      </div>
                      {discountExpiry && (
                        <input type="date" value={discountExpiry} onChange={e => setDiscountExpiry(e.target.value)} min={todayStr}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,152,0,0.3)', borderRadius: '9px', padding: '9px 12px', color: '#F1F5F9', fontSize: '13px', boxSizing: 'border-box', colorScheme: 'dark' }} />
                      )}
                      {!discountExpiry && <div style={{ color: '#4B5563', fontSize: '11px', marginTop: '4px' }}>Reducerea rămâne activă până o modifici sau o elimini manual.</div>}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setDiscountTarget(null)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#6B7280', padding: '9px 18px', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Anulează</button>
                      <button onClick={handleApplyDiscount} disabled={discountSaving || !discountValue}
                        style={{ background: discountValue ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${discountValue ? 'rgba(255,215,0,0.4)' : 'transparent'}`, color: discountValue ? '#FFD700' : '#4B5563', padding: '9px 20px', borderRadius: '9px', cursor: discountValue ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {discountSaving ? <CircleNotch size={14} className="animate-spin" /> : <Tag size={14} />}
                        {discountTarget.old_price ? 'Salvează modificările' : 'Aplică reducerea'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* ═══════════════════════════════════════════════════════════
            SEGMENTARE CLIENȚI (MARKETING)
        ══════════════════════════════════════════════════════════ */}
        {section === 'segmentare_mkt' && (() => {
          const seg = clientSegments
          if (!seg) return <div style={{ color: '#4B5563', padding: '40px', textAlign: 'center' }}>Se încarcă datele...</div>

          const freqColors = ['#FF5252','#FF9800','#FFD700','#00C853','#00E676']
          const maxFreq = Math.max(...(seg.order_freq_dist || []).map(d => d.clients), 1)
          const returningPct = seg.total_clients ? Math.round(seg.returning_buyers / seg.total_clients * 100) : 0

          return (
            <div>
              <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Segmentare Clienți</h1>
              <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '20px' }}>Comportamentul clienților — util pentru targetare campanii și vouchere</p>

              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {[
                  { label: 'Clienți totali',         value: seg.total_clients,                    color: '#0EF6FF', sub: 'cu cel puțin o comandă' },
                  { label: 'Clienți care revin',      value: `${seg.returning_buyers} (${returningPct}%)`, color: '#00E676', sub: 'au cumpărat de ≥2 ori' },
                  { label: 'Comandă medie',           value: seg.avg_order_value.toFixed(0)+' RON', color: '#FFD700', sub: `~${seg.avg_orders_per_client} comenzi/client` },
                  { label: 'Folosesc vouchere',       value: `${seg.voucher_users} (${seg.voucher_pct}%)`, color: '#CE93D8', sub: 'din totalul clienților' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#0F1923', border: `1px solid ${k.color}33`, borderRadius: '14px', padding: '20px' }}>
                    <div style={{ color: k.color, fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{k.label}</div>
                    <div style={{ color: '#F1F5F9', fontSize: '26px', fontWeight: '800', lineHeight: 1 }}>{k.value}</div>
                    <div style={{ color: '#4B5563', fontSize: '11px', marginTop: '5px' }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Distribuție frecvență comenzi */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Frecvență comenzi per client</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(seg.order_freq_dist || []).map((d, i) => (
                      <div key={d.orders} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: freqColors[i], fontSize: '12px', fontWeight: '700', width: '52px', flexShrink: 0 }}>
                          {d.orders === 5 ? '5+' : d.orders} {d.orders === 1 ? 'cmd' : 'cmz'}
                        </span>
                        <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(d.clients/maxFreq)*100}%`, background: freqColors[i], borderRadius: '4px', transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ color: '#6B7280', fontSize: '11px', width: '36px', textAlign: 'right', flexShrink: 0 }}>{d.clients}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.1)', borderRadius: '10px' }}>
                    <div style={{ color: '#9CA3AF', fontSize: '11px', marginBottom: '4px' }}>💡 Sugestie campanie</div>
                    <div style={{ color: '#F1F5F9', fontSize: '12px' }}>
                      {seg.single_buyers > seg.returning_buyers
                        ? `${seg.single_buyers} clienți au cumpărat o singură dată — voucher pentru a doua comandă poate crește retenția.`
                        : `${returningPct}% din clienți revin — targetează-i cu campanii exclusive pentru clienți fideli.`}
                    </div>
                  </div>
                </div>

                {/* Pie single vs returning + top spenderi */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Mini pie single vs returning */}
                  <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>Clienți noi vs. care revin</div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                        <svg width="80" height="80" viewBox="0 0 80 80">
                          {(() => {
                            const r = 30, cx = 40, cy = 40
                            const total = seg.total_clients || 1
                            const retPct = seg.returning_buyers / total
                            const singlePct = seg.single_buyers / total
                            const circumference = 2 * Math.PI * r
                            const retDash = retPct * circumference
                            const singleDash = singlePct * circumference
                            return <>
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00E676" strokeWidth="14"
                                strokeDasharray={`${retDash} ${circumference}`} strokeDashoffset={circumference * 0.25} strokeLinecap="round" />
                              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#CE93D8" strokeWidth="14"
                                strokeDasharray={`${singleDash} ${circumference}`} strokeDashoffset={circumference * 0.25 - retDash} strokeLinecap="round" />
                            </>
                          })()}
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F1F5F9', fontSize: '13px', fontWeight: '800' }}>
                          {returningPct}%
                        </div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00E676', display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Revin: <strong style={{ color: '#F1F5F9' }}>{seg.returning_buyers}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#CE93D8', display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ color: '#9CA3AF', fontSize: '12px' }}>O singură dată: <strong style={{ color: '#F1F5F9' }}>{seg.single_buyers}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#CE93D8', opacity: 0.4, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ color: '#9CA3AF', fontSize: '12px' }}>Folosesc vouchere: <strong style={{ color: '#F1F5F9' }}>{seg.voucher_users}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top spenderi */}
                  <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px', flex: 1 }}>
                    <div style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Top 5 clienți după valoare</div>
                    {(seg.top_spenders || []).length === 0 ? (
                      <div style={{ color: '#4B5563', fontSize: '13px' }}>Nu există date.</div>
                    ) : (seg.top_spenders || []).map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: i < seg.top_spenders.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <span style={{ color: ['#FFD700','#9CA3AF','#CD7F32','#4B5563','#4B5563'][i], fontSize: '12px', fontWeight: '800', width: '16px', flexShrink: 0 }}>#{i+1}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                          <div style={{ color: '#4B5563', fontSize: '11px' }}>{c.orders} comenzi</div>
                        </div>
                        <div style={{ color: '#FFD700', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{c.total.toFixed(0)} RON</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Export */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => exportCSV((seg.top_spenders||[]).map(c => ({ Email: c.email, Comenzi: c.orders, 'Total RON': c.total })), 'top-clienti.csv')}
                  style={{ background: 'rgba(14,246,255,0.08)', border: '1px solid rgba(14,246,255,0.2)', color: '#0EF6FF', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  ↓ Export top clienți CSV
                </button>
              </div>
            </div>
          )
        })()}

        {section === 'achizitii_dashboard' && (() => {
          const now = new Date()
          const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
          const zeroStock     = products.filter(p => p.stock === 0)
          const lowStock      = products.filter(p => p.stock > 0 && p.stock <= 5)
          const recentlyAdded = products
            .filter(p => p.created_at && new Date(p.created_at) >= thirtyDaysAgo)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 10)

          return (
            <div>
              <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Dashboard Achiziții</h1>
              <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '20px' }}>Vedere de ansamblu stoc și activitate recent</p>

              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {[
                  { label: 'Total produse',      value: products.length,       color: '#42A5F5', sub: 'în catalog',                         onClick: () => goTo('stoc_achizitii') },
                  { label: 'Stoc zero',          value: zeroStock.length,      color: '#FF5252', sub: 'necesită reaprovizionare urgentă',    onClick: () => { setAcqStockFilter('zero'); goTo('stoc_achizitii') } },
                  { label: 'Stoc redus (≤5)',    value: lowStock.length,       color: '#FF9800', sub: 'sub pragul de alertă',               onClick: () => { setAcqStockFilter('low'); goTo('stoc_achizitii') } },
                  { label: 'Adăugate (30 zile)', value: recentlyAdded.length,  color: '#00E676', sub: 'produse noi în catalog',              onClick: null },
                ].map(k => (
                  <div key={k.label} onClick={k.onClick}
                    style={{ background: '#0F1923', border: `1px solid ${k.color}33`, borderRadius: '14px', padding: '20px', cursor: k.onClick ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => k.onClick && (e.currentTarget.style.borderColor = k.color+'77')}
                    onMouseLeave={e => k.onClick && (e.currentTarget.style.borderColor = k.color+'33')}
                  >
                    <div style={{ color: k.color, fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{k.label}</div>
                    <div style={{ color: '#F1F5F9', fontSize: '32px', fontWeight: '800', lineHeight: 1 }}>{k.value}</div>
                    <div style={{ color: '#4B5563', fontSize: '11px', marginTop: '5px' }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Alerte stoc */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <Warning size={16} style={{ color: '#FF5252' }} />
                    <span style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '14px' }}>Alerte stoc</span>
                    <span style={{ background: 'rgba(255,82,82,0.12)', color: '#FF5252', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', marginLeft: 'auto' }}>
                      {zeroStock.length + lowStock.length}
                    </span>
                  </div>
                  {zeroStock.length === 0 && lowStock.length === 0 ? (
                    <p style={{ color: '#4B5563', fontSize: '13px', margin: 0 }}>Nicio alertă de stoc momentan.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
                      {[...zeroStock.slice(0, 8), ...lowStock.slice(0, 8)].slice(0, 12).map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: `1px solid ${p.stock === 0 ? 'rgba(255,82,82,0.15)' : 'rgba(255,152,0,0.15)'}` }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                            <div style={{ color: '#6B7280', fontSize: '11px' }}>{p.sku || '—'}</div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', flexShrink: 0, background: p.stock === 0 ? 'rgba(255,82,82,0.12)' : 'rgba(255,152,0,0.12)', color: p.stock === 0 ? '#FF5252' : '#FF9800' }}>
                            {p.stock === 0 ? 'ZERO' : `stoc: ${p.stock}`}
                          </span>
                        </div>
                      ))}
                      {(zeroStock.length + lowStock.length) > 12 && (
                        <button onClick={() => { setAcqStockFilter('zero'); setSection('stoc_achizitii') }} style={{ background: 'none', border: 'none', color: '#0EF6FF', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textAlign: 'left', padding: '4px 0' }}>
                          Vezi toate alertele →
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Adăugate recent */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <PlusCircle size={16} style={{ color: '#00E676' }} />
                    <span style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '14px' }}>Adăugate recent (30 zile)</span>
                  </div>
                  {recentlyAdded.length === 0 ? (
                    <p style={{ color: '#4B5563', fontSize: '13px', margin: 0 }}>Niciun produs adăugat în ultimele 30 de zile.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
                      {recentlyAdded.map(p => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                            <div style={{ color: '#6B7280', fontSize: '11px' }}>{p.sku || '—'} · {p.brand || '—'}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: '700' }}>{p.price} RON</div>
                            <div style={{ color: p.stock === 0 ? '#FF5252' : p.stock <= 5 ? '#FF9800' : '#00E676', fontSize: '11px' }}>
                              stoc: {p.stock}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Stoc pe categorie + Calitate catalog */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                {/* Stoc per categorie */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '14px', marginBottom: '14px' }}>Stoc total per categorie</div>
                  {(() => {
                    const catStock = {}
                    products.forEach(p => {
                      const cat = p.category || 'Necategorizat'
                      if (!catStock[cat]) catStock[cat] = { total: 0, zero: 0 }
                      catStock[cat].total += p.stock
                      if (p.stock === 0) catStock[cat].zero++
                    })
                    const sorted = Object.entries(catStock).sort((a,b) => b[1].total - a[1].total).slice(0, 7)
                    const maxTotal = sorted[0]?.[1]?.total || 1
                    return sorted.map(([cat, data]) => (
                      <div key={cat} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#9CA3AF', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{cat}</span>
                          <span style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
                            <span style={{ color: '#F1F5F9', fontSize: '11px', fontWeight: '700' }}>{data.total} buc</span>
                            {data.zero > 0 && <span style={{ color: '#FF5252', fontSize: '10px' }}>{data.zero} zero</span>}
                          </span>
                        </div>
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(data.total / maxTotal) * 100}%`, background: data.zero > 0 ? '#FF9800' : '#00E676', borderRadius: '3px' }} />
                        </div>
                      </div>
                    ))
                  })()}
                </div>

                {/* Calitate catalog */}
                <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '14px', marginBottom: '14px' }}>Calitate catalog</div>
                  {(() => {
                    const total = products.length || 1
                    const withSku        = products.filter(p => p.sku).length
                    const withBrand      = products.filter(p => p.brand).length
                    const withWarranty   = products.filter(p => p.warranty_months).length
                    const withDesc       = products.filter(p => p.description && p.description.trim().length > 20).length
                    const metrics = [
                      { label: 'Au SKU',         count: withSku,      color: '#42A5F5' },
                      { label: 'Au brand',        count: withBrand,    color: '#00E676' },
                      { label: 'Au garanție',     count: withWarranty, color: '#CE93D8' },
                      { label: 'Au descriere',    count: withDesc,     color: '#FFD700' },
                    ]
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {metrics.map(m => {
                          const pct = Math.round(m.count / total * 100)
                          return (
                            <div key={m.label}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#9CA3AF', fontSize: '11px' }}>{m.label}</span>
                                <span style={{ color: m.color, fontSize: '11px', fontWeight: '700' }}>{m.count}/{total} <span style={{ color: '#6B7280', fontWeight: '400' }}>({pct}%)</span></span>
                              </div>
                              <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                              </div>
                            </div>
                          )
                        })}
                        {(() => {
                          const incomplete = products.filter(p => !p.sku || !p.brand || !p.warranty_months).length
                          return incomplete > 0 ? (
                            <div onClick={() => { setAcqStockFilter('incomplete'); goTo('stoc_achizitii') }} style={{ marginTop: '4px', background: 'rgba(255,152,0,0.08)', border: '1px solid rgba(255,152,0,0.2)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <span style={{ color: '#FF9800', fontSize: '11px', fontWeight: '600' }}>⚠ {incomplete} produse cu date incomplete</span>
                                <span style={{ color: '#6B7280', fontSize: '11px' }}> — SKU/brand/garanție</span>
                              </div>
                              <span style={{ color: '#0EF6FF', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>Completează →</span>
                            </div>
                          ) : (
                            <div style={{ marginTop: '4px', background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: '8px', padding: '8px 12px' }}>
                              <span style={{ color: '#00E676', fontSize: '11px', fontWeight: '600' }}>Catalog complet ✓</span>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => goTo('add')} style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.25)', color: '#00E676', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  + Adaugă produs nou
                </button>
                <button onClick={() => goTo('stoc_achizitii')} style={{ background: 'rgba(14,246,255,0.08)', border: '1px solid rgba(14,246,255,0.2)', color: '#0EF6FF', borderRadius: '10px', padding: '10px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  Gestiune stoc →
                </button>
              </div>
            </div>
          )
        })()}

        {section === 'stoc_achizitii' && (() => {
          const isIncomplete = (p) => !p.sku || !p.brand || !p.warranty_months
          const stockBand = (p) => {
            if (p.stock === 0) return 'zero'
            if (p.stock <= 5) return 'low'
            return 'ok'
          }
          const incompleteCount = products.filter(isIncomplete).length

          const filtered = products
            .filter(p => {
              if (acqStockFilter === 'incomplete') return isIncomplete(p)
              if (acqStockFilter !== 'all' && stockBand(p) !== acqStockFilter) return false
              if (acqSearch) {
                const q = acqSearch.toLowerCase()
                return (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q)
              }
              return true
            })
            .sort((a, b) => acqStockFilter === 'incomplete' ? (a.name||'').localeCompare(b.name||'') : a.stock - b.stock)

          const handleAcqRestock = async (productId) => {
            const qty = parseInt(acqRestockValues[productId] || 0)
            if (!qty || qty <= 0) return
            setAcqRestockSaving(prev => ({ ...prev, [productId]: true }))
            try {
              const prod = products.find(p => p.id === productId)
              await productsAdminAPI.update(productId, { stock: (prod?.stock || 0) + qty })
              setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: (p.stock || 0) + qty } : p))
              setAcqRestockValues(prev => ({ ...prev, [productId]: '' }))
              flash(`Stoc actualizat: +${qty} unități`)
            } catch { flash('Eroare la actualizarea stocului', false) }
            finally { setAcqRestockSaving(prev => ({ ...prev, [productId]: false })) }
          }

          const getEdit = (id) => acqInlineEdits[id] || {}
          const setEdit = (id, field, val) => setAcqInlineEdits(prev => ({ ...prev, [id]: { ...getEdit(id), [field]: val } }))
          const initEdit = (p) => {
            if (!acqInlineEdits[p.id]) {
              setAcqInlineEdits(prev => ({ ...prev, [p.id]: { sku: p.sku || '', brand: p.brand || '', warranty_months: p.warranty_months || '' } }))
            }
          }

          const handleSaveIncomplete = async (p) => {
            const edits = acqInlineEdits[p.id] || {}
            setAcqInlineSaving(prev => ({ ...prev, [p.id]: true }))
            try {
              await productsAdminAPI.update(p.id, {
                name: p.name, slug: p.slug, brand: edits.brand ?? p.brand,
                sku: edits.sku || null, warranty_months: parseInt(edits.warranty_months) || p.warranty_months,
                price: p.price, stock: p.stock, category_id: p.category_id,
                description: p.description || '',
              })
              setProducts(prev => prev.map(x => x.id === p.id ? { ...x, sku: edits.sku || null, brand: edits.brand || x.brand, warranty_months: parseInt(edits.warranty_months) || x.warranty_months } : x))
              setAcqInlineEdits(prev => { const n = { ...prev }; delete n[p.id]; return n })
              flash('Date salvate!')
            } catch { flash('Eroare la salvare', false) }
            finally { setAcqInlineSaving(prev => ({ ...prev, [p.id]: false })) }
          }

          const stockBands = [
            { key: 'all',        label: 'Toate',           count: products.length },
            { key: 'zero',       label: 'Zero stoc',       count: products.filter(p => stockBand(p) === 'zero').length,  color: '#FF5252' },
            { key: 'low',        label: 'Stoc redus',      count: products.filter(p => stockBand(p) === 'low').length,   color: '#FF9800' },
            { key: 'ok',         label: 'OK',              count: products.filter(p => stockBand(p) === 'ok').length,    color: '#00E676' },
            { key: 'incomplete', label: 'Date incomplete', count: incompleteCount, color: '#CE93D8' },
          ]

          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', margin: 0 }}>Gestiune Stoc</h1>
                <button onClick={() => exportCSV(filtered.map(p => ({ SKU: p.sku || '', Produs: p.name, Brand: p.brand || '', Categorie: p.category || '', Stoc: p.stock, Pret_RON: p.price, Garantie_luni: p.warranty_months || '' })), 'stoc-achizitii.csv')}
                  style={{ background: 'rgba(14,246,255,0.08)', border: '1px solid rgba(14,246,255,0.2)', color: '#0EF6FF', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  ↓ Export CSV
                </button>
              </div>
              <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '16px' }}>Monitorizează și actualizează stocul produselor</p>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                {stockBands.map(b => (
                  <button key={b.key} onClick={() => setAcqStockFilter(b.key)}
                    style={{ background: acqStockFilter === b.key ? 'rgba(14,246,255,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${acqStockFilter === b.key ? 'rgba(14,246,255,0.35)' : 'rgba(255,255,255,0.08)'}`, color: acqStockFilter === b.key ? '#0EF6FF' : '#9CA3AF', borderRadius: '20px', padding: '5px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    {b.label} <span style={{ marginLeft: '4px', color: b.color || (acqStockFilter === b.key ? '#0EF6FF' : '#6B7280') }}>{b.count}</span>
                  </button>
                ))}
                {acqStockFilter !== 'incomplete' && (
                  <input
                    value={acqSearch}
                    onChange={e => setAcqSearch(e.target.value)}
                    placeholder="Caută produs, SKU, brand..."
                    style={{ marginLeft: 'auto', background: '#0F1923', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', outline: 'none', width: '220px' }}
                  />
                )}
              </div>

              {/* Table — modul Date incomplete */}
              {acqStockFilter === 'incomplete' ? (
                <div>
                  <div style={{ background: 'rgba(206,147,216,0.07)', border: '1px solid rgba(206,147,216,0.2)', borderRadius: '10px', padding: '10px 16px', marginBottom: '14px', fontSize: '12px', color: '#CE93D8' }}>
                    Completează direct câmpurile lipsă și apasă <strong>Salvează</strong>. Rândul dispare automat când toate datele sunt complete.
                  </div>
                  <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 140px 100px 120px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {['Produs', 'SKU', 'Brand', 'Garanție (luni)', 'Acțiune'].map(h => (
                        <div key={h} style={{ color: '#4B5563', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', padding: '10px 14px' }}>{h}</div>
                      ))}
                    </div>
                    {filtered.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center' }}>
                        <div style={{ color: '#00E676', fontSize: '16px', marginBottom: '6px' }}>✓</div>
                        <div style={{ color: '#4B5563', fontSize: '13px' }}>Toate produsele au date complete!</div>
                      </div>
                    ) : filtered.map((p, i) => {
                      const edit = acqInlineEdits[p.id]
                      if (!edit) { initEdit(p); return null }
                      const missingFields = [!p.sku && 'SKU', !p.brand && 'brand', !p.warranty_months && 'garanție'].filter(Boolean)
                      const hasChange = (edit.sku !== (p.sku || '')) || (edit.brand !== (p.brand || '')) || (String(edit.warranty_months) !== String(p.warranty_months || ''))
                      return (
                        <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 150px 140px 100px 120px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', alignItems: 'center' }}>
                          <div style={{ padding: '8px 14px', minWidth: 0 }}>
                            <div style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
                              {missingFields.map(f => (
                                <span key={f} style={{ background: 'rgba(255,82,82,0.1)', color: '#FF5252', fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>lipsă {f}</span>
                              ))}
                            </div>
                          </div>
                          <div style={{ padding: '6px 10px' }}>
                            <input
                              value={edit.sku}
                              onChange={e => setEdit(p.id, 'sku', e.target.value)}
                              placeholder="ex: AMD-R5-7600X"
                              style={{ width: '100%', background: p.sku ? '#0A1520' : 'rgba(255,82,82,0.06)', border: `1px solid ${p.sku ? 'rgba(255,255,255,0.1)' : 'rgba(255,82,82,0.3)'}`, color: '#F1F5F9', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div style={{ padding: '6px 10px' }}>
                            <input
                              value={edit.brand}
                              onChange={e => setEdit(p.id, 'brand', e.target.value)}
                              placeholder="ex: AMD"
                              style={{ width: '100%', background: p.brand ? '#0A1520' : 'rgba(255,82,82,0.06)', border: `1px solid ${p.brand ? 'rgba(255,255,255,0.1)' : 'rgba(255,82,82,0.3)'}`, color: '#F1F5F9', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div style={{ padding: '6px 10px' }}>
                            <input
                              type="number" min="0"
                              value={edit.warranty_months}
                              onChange={e => setEdit(p.id, 'warranty_months', e.target.value)}
                              placeholder="24"
                              style={{ width: '100%', background: p.warranty_months ? '#0A1520' : 'rgba(255,82,82,0.06)', border: `1px solid ${p.warranty_months ? 'rgba(255,255,255,0.1)' : 'rgba(255,82,82,0.3)'}`, color: '#F1F5F9', borderRadius: '6px', padding: '5px 8px', fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div style={{ padding: '6px 10px' }}>
                            <button
                              onClick={() => handleSaveIncomplete(p)}
                              disabled={acqInlineSaving[p.id] || !hasChange}
                              style={{ background: hasChange ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${hasChange ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.08)'}`, color: hasChange ? '#00E676' : '#4B5563', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', cursor: hasChange ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', width: '100%' }}>
                              {acqInlineSaving[p.id] ? '...' : 'Salvează'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ color: '#4B5563', fontSize: '11px', marginTop: '8px', textAlign: 'right' }}>
                    {filtered.length} produse cu date incomplete
                  </div>
                </div>
              ) : (
                <div>
                  {/* Table stoc normal */}
                  <div style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 120px 80px 100px 180px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {['SKU', 'Produs', 'Brand', 'Stoc', 'Preț', 'Reaprovizionare'].map(h => (
                        <div key={h} style={{ color: '#4B5563', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', padding: '10px 14px' }}>{h}</div>
                      ))}
                    </div>
                    {filtered.length === 0 ? (
                      <p style={{ color: '#4B5563', fontSize: '13px', padding: '20px', margin: 0 }}>Niciun produs găsit.</p>
                    ) : filtered.map((p, i) => {
                      const band = stockBand(p)
                      const stockColor = band === 'zero' ? '#FF5252' : band === 'low' ? '#FF9800' : '#00E676'
                      return (
                        <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 120px 80px 100px 180px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                          <div style={{ padding: '10px 14px', color: '#6B7280', fontSize: '11px', fontFamily: 'monospace', display: 'flex', alignItems: 'center' }}>{p.sku || '—'}</div>
                          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                            <div style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                            {p.warranty_months && <div style={{ color: '#4B5563', fontSize: '10px' }}>Garanție: {p.warranty_months} luni</div>}
                          </div>
                          <div style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: '12px', display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.brand || '—'}</div>
                          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: stockColor, fontSize: '13px', fontWeight: '800' }}>{p.stock}</span>
                          </div>
                          <div style={{ padding: '10px 14px', color: '#9CA3AF', fontSize: '12px', display: 'flex', alignItems: 'center' }}>{p.price} RON</div>
                          <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number" min="1" placeholder="+qty"
                              value={acqRestockValues[p.id] || ''}
                              onChange={e => setAcqRestockValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleAcqRestock(p.id)}
                              style={{ width: '70px', background: '#0A1520', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', outline: 'none' }}
                            />
                            <button
                              onClick={() => handleAcqRestock(p.id)}
                              disabled={acqRestockSaving[p.id] || !acqRestockValues[p.id]}
                              style={{ background: acqRestockValues[p.id] ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${acqRestockValues[p.id] ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.08)'}`, color: acqRestockValues[p.id] ? '#00E676' : '#4B5563', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', cursor: acqRestockValues[p.id] ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
                              {acqRestockSaving[p.id] ? '...' : 'Salvează'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ color: '#4B5563', fontSize: '11px', marginTop: '8px', textAlign: 'right' }}>
                    {filtered.length} produse afișate din {products.length} total
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {section === 'dashboard' && (
          <div>
            <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>
              Dashboard
            </h1>
            <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '24px' }}>
              Privire de ansamblu asupra afacerii
            </p>

            {/* STATS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
              {[
                { label: 'Produse in catalog', val: stats.products,          Icon: Package,      color: '#42A5F5' },
                { label: 'Total comenzi',       val: stats.orders,            Icon: ShoppingCart, color: '#CE93D8' },
                { label: 'Venituri totale',     val: stats.revenue.toFixed(0) + ' RON', Icon: ShoppingCart, color: '#00E676' },
                { label: 'Tichete active',      val: stats.svcActive + stats.retActive, Icon: Wrench,       color: '#FF9800' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.color}22`,
                  borderRadius: '14px', padding: '18px 20px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: `${s.color}18`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                  }}>
                    <s.Icon size={22} style={{ color: s.color }} />
                  </div>
                  <div>
                    <div style={{ color: s.color, fontSize: '22px', fontWeight: '800', lineHeight: 1 }}>{s.val}</div>
                    <div style={{ color: '#6B7280', fontSize: '11px', marginTop: '3px' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', marginBottom: '24px' }}>

              {/* REVENUE CHART */}
              <div style={{ ...tableWrap, padding: '22px' }}>
                <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px', marginBottom: '20px' }}>
                  Venituri ultimele 7 zile
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px' }}>
                  {revenue7.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ color: '#6B7280', fontSize: '10px' }}>
                        {d.val > 0 ? Math.round(d.val) : ''}
                      </div>
                      <div style={{
                        width: '100%', borderRadius: '6px 6px 0 0',
                        background: d.val > 0 ? 'var(--cyan)' : 'rgba(255,255,255,0.05)',
                        height: `${Math.max((d.val / maxRev) * 100, d.val > 0 ? 6 : 2)}%`,
                        transition: 'height 0.4s ease',
                        minHeight: '2px',
                      }} />
                      <div style={{ color: '#4B5563', fontSize: '10px', whiteSpace: 'nowrap' }}>{d.day}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* LOW STOCK ALERTS */}
              <div style={{ ...tableWrap, padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Warning size={18} className="text-price" />
                  <span style={{ color: '#FF9800', fontWeight: '700', fontSize: '15px' }}>Stoc critic</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#6B7280', fontSize: '11px' }}>Prag:</span>
                    <input type="number" min="1" max="20" value={stockThreshold}
                      onChange={e => setStockThreshold(parseInt(e.target.value) || 3)}
                      style={{ width: '48px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,152,0,0.3)', color: '#FF9800', padding: '2px 6px', borderRadius: '6px', fontSize: '12px', outline: 'none', textAlign: 'center' }}
                    />
                    <span style={{ color: '#6B7280', fontSize: '11px' }}>buc</span>
                  </div>
                  <span style={{ background: 'rgba(255,152,0,0.15)', color: '#FF9800', borderRadius: '10px', padding: '1px 8px', fontSize: '11px', fontWeight: '700' }}>{lowStock.length}</span>
                </div>
                {lowStock.length === 0 ? (
                  <p style={{ color: '#4B5563', fontSize: '13px' }}>Toate produsele au stoc suficient</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '160px' }}>
                    {lowStock.map(p => (
                      <div key={p.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'rgba(255,152,0,0.06)', borderRadius: '8px', padding: '8px 12px',
                        border: '1px solid rgba(255,152,0,0.15)',
                      }}>
                        <div>
                          <div style={{ color: '#F1F5F9', fontSize: '12px', fontWeight: '600' }}>{p.name}</div>
                          <div style={{ color: '#6B7280', fontSize: '11px' }}>{p.brand}</div>
                        </div>
                        <span style={{
                          background: p.stock === 1 ? 'rgba(255,82,82,0.15)' : 'rgba(255,152,0,0.15)',
                          color: p.stock === 1 ? '#FF5252' : '#FF9800',
                          borderRadius: '8px', padding: '2px 8px', fontSize: '11px', fontWeight: '800',
                        }}>{p.stock} buc</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RECENT ORDERS */}
            <div style={tableWrap}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px' }}>Comenzi recente</span>
                <button onClick={() => goTo('orders')} className="bg-accent/10 border border-accent/25 text-accent px-3 py-1 rounded-md cursor-pointer text-xs font-semibold hover:bg-accent/20 transition-colors">
                  Vezi toate →
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['ID', 'Client', 'Total', 'Metoda', 'Status', 'Data'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrds.map(o => {
                    return (
                      <tr key={o.id} className="transition-colors hover:bg-white/[0.02]">
                        <td style={{ ...td, fontFamily: 'monospace', fontSize: '12px', color: '#6B7280' }}>
                          #{o.id.slice(0,8).toUpperCase()}
                        </td>
                        <td style={td}>
                          <div style={{ color: '#F1F5F9', fontSize: '13px' }}>
                            {o.shipping_address?.full_name || '—'}
                          </div>
                          <div style={{ color: '#4B5563', fontSize: '11px' }}>
                            {o.shipping_address?.city}
                          </div>
                        </td>
                        <td style={{ ...td, color: 'var(--cyan)', fontWeight: '700' }}>{o.total_price} RON</td>
                        <td style={{ ...td, color: '#CE93D8', fontSize: '12px', textTransform: 'uppercase' }}>
                          {o.payment_method_type}
                        </td>
                        <td style={td}><Badge cfg={orderStatusCfg} status={o.status} /></td>
                        <td style={{ ...td, color: '#6B7280', fontSize: '12px' }}>
                          {new Date(o.created_at).toLocaleDateString('ro-RO')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {recentOrds.length === 0 && (
                <p style={{ textAlign: 'center', color: '#4B5563', padding: '32px' }}>Nu exista comenzi</p>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            RAPOARTE
        ══════════════════════════════════════════════════════ */}
        {section === 'rapoarte' && (() => {
          const today = new Date().toISOString().slice(0, 10)
          const thisMonth = new Date().toISOString().slice(0, 7)
          const revenueToday = orders.filter(o => (o.created_at||'').startsWith(today)).reduce((s,o) => s + parseFloat(o.total_price||0), 0)
          const revenueMonth = orders.filter(o => (o.created_at||'').startsWith(thisMonth)).reduce((s,o) => s + parseFloat(o.total_price||0), 0)
          const avgOrder     = orders.length ? orders.reduce((s,o) => s + parseFloat(o.total_price||0), 0) / orders.length : 0
          const deliveredPct = orders.length ? Math.round(orders.filter(o => o.status === 'delivered').length / orders.length * 100) : 0

          // date pentru grafice
          const areaData = revenue7.map(d => ({ zi: d.day, Venituri: Math.round(d.val) }))

          const barCatData = revenueByCategory.map(([cat, rev]) => ({
            cat: cat.length > 10 ? cat.slice(0, 10) + '…' : cat,
            fullCat: cat,
            Venituri: Math.round(rev),
          }))

          const PIE_COLORS = ['#42A5F5','#00E676','#CE93D8','#FF9800','#FF5252','#FFD700','#4FC3F7','#81C784']
          const pieData = revenueByCategory.map(([cat, rev]) => ({ name: cat, value: Math.round(rev) }))

          const topBarData = topProducts.slice(0, 10).map(p => ({
            name: p.name.length > 18 ? p.name.slice(0, 18) + '…' : p.name,
            fullName: p.name,
            Cantitate: p.quantity,
            Revenue: Math.round(p.revenue),
          }))

          const tooltipStyle = {
            contentStyle: { background: '#0D1421', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#F1F5F9', fontSize: '12px' },
            labelStyle: { color: '#9CA3AF', fontSize: '11px' },
            cursor: { fill: 'rgba(255,255,255,0.04)' },
          }

          const cardStyle = (color) => ({
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}22`,
            borderRadius: '14px', padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: '14px',
          })

          return (
            <div>
              <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>Rapoarte & Statistici</h1>
              <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '24px' }}>Analiza vanzarilor si performanta catalogului</p>

              {/* KPI CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
                {[
                  { label: 'Venituri azi',           val: revenueToday.toFixed(0) + ' RON', Icon: CalendarBlank,   color: '#42A5F5' },
                  { label: 'Venituri luna curenta',   val: revenueMonth.toFixed(0) + ' RON', Icon: CalendarBlank,   color: '#00E676' },
                  { label: 'Valoare medie comanda',   val: avgOrder.toFixed(0) + ' RON',     Icon: CurrencyDollar,  color: '#CE93D8' },
                  { label: 'Rata livrare succes',     val: deliveredPct + '%',                Icon: CheckCircle,     color: '#FF9800' },
                ].map(s => (
                  <div key={s.label} style={cardStyle(s.color)}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <s.Icon size={22} style={{ color: s.color }} />
                    </div>
                    <div>
                      <div style={{ color: s.color, fontSize: '20px', fontWeight: '800', lineHeight: 1 }}>{s.val}</div>
                      <div style={{ color: '#6B7280', fontSize: '11px', marginTop: '3px' }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ROW 1: Area chart venituri 7 zile + Pie chart categorii */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '20px' }}>

                {/* Area chart — Venituri 7 zile */}
                <div style={{ ...tableWrap, padding: '22px' }}>
                  <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px', marginBottom: '20px' }}>
                    Venituri — ultimele 7 zile
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={areaData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="var(--cyan)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="zi" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v > 0 ? v + ' RON' : ''} width={70} />
                      <Tooltip {...tooltipStyle} formatter={v => [v + ' RON', 'Venituri']} />
                      <Area type="monotone" dataKey="Venituri" stroke="var(--cyan)" strokeWidth={2} fill="url(#colorVen)" dot={{ fill: 'var(--cyan)', r: 3 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie chart — distributie pe categorii */}
                <div style={{ ...tableWrap, padding: '22px' }}>
                  <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px', marginBottom: '20px' }}>
                    Venituri per categorie
                  </div>
                  {pieData.length === 0 ? (
                    <p style={{ color: '#4B5563', fontSize: '13px', paddingTop: '60px', textAlign: 'center' }}>Nu exista date</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={270}>
                      <PieChart>
                        <Pie
                          data={pieData} cx="50%" cy="42%"
                          innerRadius={60} outerRadius={95}
                          paddingAngle={3} dataKey="value"
                          minAngle={5}
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle.contentStyle}
                          formatter={(v, name) => [v.toLocaleString('ro-RO') + ' RON', name]}
                        />
                        <Legend
                          iconType="circle" iconSize={8}
                          wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                          formatter={val => <span style={{ color: '#9CA3AF', fontSize: '11px' }}>{val}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* ROW 2: Bar chart categorii + Top produse bar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                {/* Bar chart — venituri per categorie */}
                <div style={{ ...tableWrap, padding: '22px' }}>
                  <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px', marginBottom: '20px' }}>
                    Venituri per categorie (RON)
                  </div>
                  {barCatData.length === 0 ? (
                    <p style={{ color: '#4B5563', fontSize: '13px', paddingTop: '60px', textAlign: 'center' }}>Nu exista date</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={barCatData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="cat" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                        <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? (v/1000).toFixed(0)+'k' : v} />
                        <Tooltip
                          {...tooltipStyle}
                          formatter={v => [v + ' RON', 'Venituri']}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullCat || ''}
                        />
                        <Bar dataKey="Venituri" radius={[6, 6, 0, 0]}>
                          {barCatData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Bar chart orizontal — Top 10 produse */}
                <div style={{ ...tableWrap, padding: '22px' }}>
                  <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px', marginBottom: '20px' }}>
                    Top 10 produse vandute (buc)
                  </div>
                  {topBarData.length === 0 ? (
                    <p style={{ color: '#4B5563', fontSize: '13px', paddingTop: '60px', textAlign: 'center' }}>Nu exista date</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={topBarData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          {...tooltipStyle}
                          formatter={(v, name) => [name === 'Cantitate' ? v + ' buc' : v + ' RON', name]}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                        />
                        <Bar dataKey="Cantitate" fill="var(--cyan)" radius={[0, 6, 6, 0]} label={{ position: 'right', fill: '#6B7280', fontSize: 10, formatter: v => v + ' buc' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* ROW 3: Status comenzi distributie */}
              <div style={{ ...tableWrap, padding: '22px' }}>
                <div style={{ color: '#F1F5F9', fontWeight: '700', fontSize: '15px', marginBottom: '20px' }}>
                  Distributie status comenzi
                </div>
                {(() => {
                  const statusData = Object.entries(
                    orders.reduce((acc, o) => {
                      const cfg = orderStatusCfg[o.status] || { label: o.status }
                      acc[cfg.label] = (acc[cfg.label] || 0) + 1
                      return acc
                    }, {})
                  ).map(([name, value]) => ({ name, value }))
                  const STATUS_COLORS = ['#FFD700','#42A5F5','#CE93D8','#FF9800','#00E676','#FF5252']
                  return (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={statusData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip {...tooltipStyle} formatter={v => [v + ' comenzi', 'Numar']} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {statusData.map((_, i) => (
                            <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )
                })()}
              </div>

            </div>
          )
        })()}

        {/* ══════════════════════════════════════════════════════
            PRODUSE
        ══════════════════════════════════════════════════════ */}
        {section === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>Catalog produse</h1>
                <p style={{ color: '#4B5563', fontSize: '13px' }}>{filteredProducts.length} / {products.length} produse</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={exportProductsCSV} style={{
                  background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)',
                  color: '#00E676', padding: '10px 18px', borderRadius: '10px',
                  cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                }}>
                  Export CSV
                </button>
                <button onClick={() => goTo('add')} className="btn-primary flex items-center gap-1.5 text-sm">
                  <PlusCircle size={15} /> Produs nou
                </button>
              </div>
            </div>

            {/* Filtre */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text" placeholder="Cauta dupa nume sau brand..."
                value={productSearch} onChange={e => setProductSearch(e.target.value)}
                className="input-field"
                style={{ width: '280px', flex: 'none', fontSize: '13px', padding: '8px 12px' }}
              />
              <select value={productCatFilter} onChange={e => setProductCatFilter(e.target.value)}
                className="input-field text-xs py-1 px-2 cursor-pointer"
                style={{ padding: '8px 12px', fontSize: '13px' }}>
                <option value="" style={{ background: '#0A0E1A' }}>Toate categoriile</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name} style={{ background: '#0A0E1A' }}>{c.name}</option>
                ))}
              </select>
              {(productSearch || productCatFilter) && (
                <button onClick={() => { setProductSearch(''); setProductCatFilter('') }} style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#9CA3AF', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                }}>
                  <X size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Reset
                </button>
              )}
            </div>

            <div style={tableWrap}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Produs', 'Categorie', 'Pret', 'Stoc', 'Status', 'Actiuni'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign:'center', padding:'48px', color:'#4B5563' }}>
                      Niciun produs gasit
                    </td></tr>
                  ) : filteredProducts.map(p => (
                    <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
                      <td style={td}>
                        <div style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '13px' }}>{p.name}</div>
                        <div style={{ color: '#4B5563', fontSize: '11px' }}>{p.brand}</div>
                      </td>
                      <td style={{ ...td, color: 'var(--cyan)', fontSize: '12px' }}>{p.category}</td>
                      <td style={{ ...td, color: '#00E676', fontWeight: '700', fontSize: '14px' }}>{p.price} RON</td>
                      <td style={td}>
                        <span style={{
                          fontSize: '12px', padding: '3px 10px', borderRadius: '12px', fontWeight: '600',
                          background: p.stock > 5 ? 'rgba(0,230,118,0.1)' : p.stock > 0 ? 'rgba(255,152,0,0.1)' : 'rgba(255,82,82,0.1)',
                          color: p.stock > 5 ? '#00E676' : p.stock > 0 ? '#FF9800' : '#FF5252',
                          border: `1px solid ${p.stock > 5 ? 'rgba(0,230,118,0.3)' : p.stock > 0 ? 'rgba(255,152,0,0.3)' : 'rgba(255,82,82,0.3)'}`,
                        }}>{p.stock} buc</span>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px', alignItems: 'center' }}>
                          <input
                            type="number"
                            placeholder="Nou stoc"
                            value={restockValues[p.id] || ''}
                            onChange={e => setRestockValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                            style={{ width: '70px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '3px 6px', borderRadius: '6px', fontSize: '11px', outline: 'none' }}
                          />
                          <button
                            onClick={() => { if (restockValues[p.id]) handleRestock(p.id, restockValues[p.id]) }}
                            disabled={!restockValues[p.id] || savingRestock[p.id]}
                            style={{ background: 'rgba(0,230,118,0.12)', border: '1px solid rgba(0,230,118,0.3)', color: '#00E676', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', opacity: !restockValues[p.id] ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {savingRestock[p.id] ? <CircleNotch size={11} className="animate-spin" /> : <Check size={11} />}
                          </button>
                        </div>
                      </td>
                      <td style={td}>
                        <span style={{
                          fontSize: '11px', padding: '3px 9px', borderRadius: '12px',
                          background: p.stock > 0 ? 'rgba(0,230,118,0.1)' : 'rgba(255,82,82,0.1)',
                          color: p.stock > 0 ? '#00E676' : '#FF5252',
                          border: `1px solid ${p.stock > 0 ? 'rgba(0,230,118,0.3)' : 'rgba(255,82,82,0.3)'}`,
                        }}>
                          {p.stock > 0 ? 'In stoc' : 'Epuizat'}
                        </span>
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => {
                            setEditProduct({
                              ...p,
                              category_id: categories.find(c => c.name === p.category)?.id || '',
                              old_price: p.old_price || '',
                              model: p.model || '',
                              description: p.description || '',
                              warranty_months: p.warranty_months || 24,
                            })
                            setEditSpecRows(specsToRows(p.specs || {}))
                            loadProductImages(p.id)
                          }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent text-xs font-semibold cursor-pointer hover:bg-accent/20 transition-colors">
                            <PencilSimple size={13} /> Edit
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id, p.name)} className="flex items-center px-2.5 py-1 rounded-lg bg-danger/10 border border-danger/30 text-danger cursor-pointer hover:bg-danger/20 transition-colors">
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            PRODUS NOU
        ══════════════════════════════════════════════════════ */}
        {section === 'add' && (
          <div>
            <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '24px' }}>
              + Produs nou
            </h1>
            <div style={{ ...tableWrap, padding: '28px', maxWidth: '800px' }}>
              <form onSubmit={handleAddProduct}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {[
                    { label: 'Nume produs', key: 'name', ph: 'AMD Ryzen 5 7600X', req: true },
                    { label: 'Slug URL', key: 'slug', ph: 'amd-ryzen-5-7600x', req: true },
                    { label: 'Brand', key: 'brand', ph: 'AMD' },
                    { label: 'Model', key: 'model', ph: 'Ryzen 5 7600X' },
                    { label: 'SKU (cod intern)', key: 'sku', ph: 'AMD-R5-7600X' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                      <input value={newProduct[f.key] || ''} onChange={e => setNewProduct({ ...newProduct, [f.key]: e.target.value })}
                        className="input-field" placeholder={f.ph} required={f.req}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Categorie</label>
                    <select value={newProduct.category_id} onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}
                      className="input-field cursor-pointer" required>
                      <option value="" style={{ background: '#0A0E1A' }}>Selecteaza...</option>
                      {categories.map(c => <option key={c.id} value={c.id} style={{ background: '#0A0E1A' }}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Garantie (luni)</label>
                    <input type="number" value={newProduct.warranty_months} onChange={e => setNewProduct({ ...newProduct, warranty_months: e.target.value })}
                      className="input-field" placeholder="24"
                    />
                  </div>
                  <div>
                    <label style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Pret (RON)</label>
                    <input type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="input-field" placeholder="1299.99" required
                    />
                  </div>
                  <div>
                    <label style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Stoc</label>
                    <input type="number" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="input-field" placeholder="10" required
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Descriere</label>
                    <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="input-field" style={{ resize: 'vertical' }} rows={3} placeholder="Descriere produs..." />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ color: '#6B7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Specificatii tehnice</label>
                      <button type="button" onClick={() => setNewSpecRows([...newSpecRows, { key:'', value:'' }])} className="bg-success/10 border border-success/30 text-success px-2.5 py-0.5 rounded-lg cursor-pointer text-xs font-semibold">+ Adauga</button>
                    </div>
                    {newSpecRows.length === 0 && <p style={{ color: '#4B5563', fontSize: '13px', fontStyle: 'italic' }}>Nicio specificatie.</p>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {newSpecRows.map((row, i) => (
                        <div key={i} style={{ display: 'flex', gap: '6px' }}>
                          <input value={row.key} onChange={e => { const r=[...newSpecRows]; r[i]={...r[i],key:e.target.value}; setNewSpecRows(r) }}
                            placeholder="Cheie" className="input-field" style={{ flex: '1' }}
                          />
                          <input value={row.value} onChange={e => { const r=[...newSpecRows]; r[i]={...r[i],value:e.target.value}; setNewSpecRows(r) }}
                            placeholder="Valoare" className="input-field" style={{ flex: '2' }}
                          />
                          <button type="button" onClick={() => setNewSpecRows(newSpecRows.filter((_,j)=>j!==i))} className="bg-danger/10 border border-danger/30 text-danger w-9 h-9 rounded-lg cursor-pointer shrink-0 hover:bg-danger/20 transition-colors flex items-center justify-center">
                            <X size={14} style={{ margin: 'auto' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn-primary mt-5 flex items-center gap-1.5">
                  <PlusCircle size={15} /> Adauga produs
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            COMENZI
        ══════════════════════════════════════════════════════ */}
        {section === 'orders' && (
          <div>
            <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '20px' }}>
              Comenzi <span style={{ color: '#4B5563', fontSize: '14px', fontWeight: '400' }}>({orders.length} total)</span>
            </h1>

            {/* Filters bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search by order nr / client */}
              <input
                type="text"
                placeholder="Nr. comandă sau client..."
                value={orderFilters.search}
                onChange={e => setOrderFilters(f => ({ ...f, search: e.target.value }))}
                className="input-field"
                style={{ padding: '7px 10px', fontSize: '13px', minWidth: '200px' }}
              />
              <select value={orderFilters.status} onChange={e => setOrderFilters(f => ({ ...f, status: e.target.value }))}
                className="input-field text-xs py-1 px-2 cursor-pointer"
                style={{ padding: '8px 12px', fontSize: '13px' }}>
                <option value="">Toate statusurile</option>
                {['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => (
                  <option key={s} value={s} style={{ background: '#0A0E1A' }}>{s}</option>
                ))}
              </select>
              <select value={orderFilters.payment} onChange={e => setOrderFilters(f => ({ ...f, payment: e.target.value }))}
                className="input-field text-xs py-1 px-2 cursor-pointer"
                style={{ padding: '8px 12px', fontSize: '13px' }}>
                <option value="">Toate metodele</option>
                {['cod','card','transfer'].map(s => (
                  <option key={s} value={s} style={{ background: '#0A0E1A' }}>{s}</option>
                ))}
              </select>
              <input type="date" value={orderFilters.dateFrom} onChange={e => setOrderFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="input-field" style={{ width: 'auto', padding: '7px 10px', fontSize: '13px', colorScheme: 'dark' }} />
              <span style={{ color: '#4B5563', fontSize: '13px' }}>→</span>
              <input type="date" value={orderFilters.dateTo} onChange={e => setOrderFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="input-field" style={{ width: 'auto', padding: '7px 10px', fontSize: '13px', colorScheme: 'dark' }} />
              <input type="number" placeholder="Preț min" value={orderFilters.priceMin} onChange={e => setOrderFilters(f => ({ ...f, priceMin: e.target.value }))}
                className="input-field" style={{ width: '90px', padding: '7px 10px', fontSize: '13px' }} />
              <span style={{ color: '#4B5563', fontSize: '13px' }}>–</span>
              <input type="number" placeholder="Preț max" value={orderFilters.priceMax} onChange={e => setOrderFilters(f => ({ ...f, priceMax: e.target.value }))}
                className="input-field" style={{ width: '90px', padding: '7px 10px', fontSize: '13px' }} />
              {Object.values(orderFilters).some(v => v) && (
                <button onClick={() => setOrderFilters({ status:'', payment:'', dateFrom:'', dateTo:'', priceMin:'', priceMax:'', search:'' })}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <X size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Reset
                </button>
              )}
              <span style={{ color: '#6B7280', fontSize: '12px', marginLeft: 'auto' }}>
                {filteredOrders.length} / {orders.length} comenzi
              </span>
              <button onClick={exportOrdersCSV} style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)', color: '#00E676', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                Export CSV
              </button>
            </div>

            <div style={tableWrap}>
              {orders.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#4B5563', padding: '48px' }}>Nu exista comenzi</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['ID', 'Client', 'Produse', 'Total', 'Status', 'Data', 'Actiuni'].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => {
                      const isExp = expandedOrders[o.id]
                      return (
                        <>
                          <tr key={o.id} className="transition-colors hover:bg-white/[0.02]">
                            <td style={{ ...td, fontFamily: 'monospace', fontSize: '11px', color: '#6B7280' }}>
                              #{o.id.slice(0,8).toUpperCase()}
                            </td>
                            <td style={td}>
                              {o.shipping_address ? (
                                <>
                                  <div style={{ color: '#F1F5F9', fontSize: '13px', fontWeight: '500' }}>
                                    {o.shipping_address.full_name}
                                  </div>
                                  <div style={{ color: '#4B5563', fontSize: '11px' }}>
                                    {o.shipping_address.city}, {o.shipping_address.county}
                                  </div>
                                </>
                              ) : <span style={{ color: '#4B5563' }}>—</span>}
                            </td>
                            <td style={{ ...td, color: '#9CA3AF', fontSize: '13px' }}>{o.items_count} buc</td>
                            <td style={{ ...td, color: 'var(--cyan)', fontWeight: '700', fontSize: '14px' }}>
                              {o.total_price} RON
                            </td>
                            <td style={td}><Badge cfg={orderStatusCfg} status={o.status} /></td>
                            <td style={{ ...td, color: '#6B7280', fontSize: '12px' }}>
                              {new Date(o.created_at).toLocaleDateString('ro-RO')}
                            </td>
                            <td style={td}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <select value={o.status} onChange={e => handleUpdateStatus(o.id, e.target.value)}
                                  className="input-field text-[11px] cursor-pointer" style={{ minWidth: '140px' }}>
                                  {['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => (
                                    <option key={s} value={s} style={{ background: '#0A0E1A' }}>{s}</option>
                                  ))}
                                </select>
                                <button onClick={() => setExpandedOrders(p => ({ ...p, [o.id]: !p[o.id] }))} style={{
                                  background: isExp ? 'rgba(206,147,216,0.15)' : 'rgba(206,147,216,0.08)',
                                  border: '1px solid rgba(206,147,216,0.3)',
                                  color: '#CE93D8', padding: '4px 8px', borderRadius: '6px',
                                  cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                                }}>{isExp ? '▲ Ascunde' : '▼ Detalii'}</button>
                                {o.payment_status === 'pending_transfer' && (
                                  <button onClick={() => handleConfirmTransfer(o.id)}
                                    disabled={confirmingTransfer === o.id} style={{
                                    background: confirmingTransfer === o.id ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#1B5E20,#4CAF50)',
                                    color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px',
                                    cursor: 'pointer', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap',
                                    opacity: confirmingTransfer === o.id ? 0.6 : 1,
                                  }}>
                                    {confirmingTransfer === o.id ? 'Se proceseaza...' : 'Confirma transfer'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isExp && (
                            <tr key={o.id + '_exp'} style={{ background: 'rgba(0,212,255,0.03)' }}>
                              <td colSpan={7} style={{ padding: '0' }}>
                                <div style={{
                                  borderTop: '1px solid rgba(0,212,255,0.1)',
                                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                                  padding: '18px 20px',
                                }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                    {/* Adresa */}
                                    <div>
                                      <div style={{ color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Adresa livrare</div>
                                      {o.shipping_address ? (
                                        <div style={{ color: '#D1D5DB', fontSize: '13px', lineHeight: '1.7' }}>
                                          <div style={{ fontWeight: '600', color: '#F1F5F9' }}>{o.shipping_address.full_name}</div>
                                          <div>{o.shipping_address.street}</div>
                                          <div>{o.shipping_address.city}, {o.shipping_address.county} {o.shipping_address.postal_code}</div>
                                          <div style={{ color: '#9CA3AF' }}>{o.shipping_address.phone}</div>
                                        </div>
                                      ) : <span style={{ color: '#4B5563' }}>—</span>}
                                    </div>
                                    {/* Plata */}
                                    <div>
                                      <div style={{ color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Plata & Factura</div>
                                      <div style={{ color: '#D1D5DB', fontSize: '13px', lineHeight: '1.8' }}>
                                        <div><span style={{ color: '#6B7280' }}>Metoda: </span>
                                          <span style={{ color: '#CE93D8', fontWeight: '600', textTransform: 'uppercase' }}>{o.payment_method_type}</span>
                                        </div>
                                        <div><span style={{ color: '#6B7280' }}>Factura: </span>
                                          <span style={{ color: 'var(--cyan)', fontFamily: 'monospace' }}>{o.invoice_number || '—'}</span>
                                        </div>
                                        <div><span style={{ color: '#6B7280' }}>Status plata: </span>
                                          <span style={{ color: o.payment_status === 'paid' ? '#00E676' : '#FF9800', fontWeight: '600' }}>{o.payment_status}</span>
                                        </div>
                                      </div>
                                    </div>
                                    {/* Tracking */}
                                    <div>
                                      <div style={{ color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Tracking AWB</div>
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        <input type="text" placeholder="Numar tracking..."
                                          value={trackingInputs[o.id] || ''}
                                          onChange={e => setTrackingInputs(p => ({ ...p, [o.id]: e.target.value }))}
                                          className="input-field" style={{ flex: 1, padding: '7px 10px', fontSize: '12px' }}
                                        />
                                        <button onClick={() => handleSaveTracking(o.id)} disabled={savingTracking[o.id]} style={{
                                          background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)',
                                          color: '#00E676', padding: '7px 12px', borderRadius: '6px',
                                          cursor: 'pointer', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap',
                                          opacity: savingTracking[o.id] ? 0.6 : 1,
                                        }}>{savingTracking[o.id] ? '...' : 'Save'}</button>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Produse */}
                                  {o.items?.length > 0 && (
                                    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                      <div style={{ color: '#6B7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>
                                        Produse ({o.items.length})
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {o.items.map((item, idx) => (
                                          <div key={idx} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px 12px',
                                          }}>
                                            <div>
                                              <span style={{ color: '#F1F5F9', fontSize: '13px', fontWeight: '500' }}>
                                                {item.product_name || item.product_snapshot?.name}
                                              </span>
                                              <span style={{ color: '#4B5563', fontSize: '12px', marginLeft: '8px' }}>x{item.quantity}</span>
                                            </div>
                                            <span style={{ color: 'var(--cyan)', fontWeight: '700', fontSize: '13px' }}>
                                              {(item.unit_price * item.quantity).toFixed(2)} RON
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            SERVICE / RMA
        ══════════════════════════════════════════════════════ */}
        {section === 'service' && (
          <div>
            <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '20px' }}>
              Cereri Service <span style={{ color: '#4B5563', fontSize: '14px', fontWeight: '400' }}>({serviceReqs.length} total)</span>
            </h1>
            <div style={tableWrap}>
              {serviceReqs.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#4B5563', padding: '48px' }}>Nu exista cereri de service</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Ticket', 'Produs', 'Descriere', 'Adresa ridicare', 'Telefon', 'Status', 'Prioritate', 'Note', 'Data', 'Schimba'].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {serviceReqs.map(r => {
                      const pdKey = `service-${r.id}`
                      const notesKey = `service-${r.id}`
                      const notes = notesByEntity[notesKey] || []
                      const notesOpen = openNotesFor === notesKey
                      return (
                        <>
                          <tr key={r.id} className="transition-colors hover:bg-white/[0.02]">
                            <td style={{ ...td, color: '#FF9800', fontFamily: 'monospace', fontSize: '12px', fontWeight: '700' }}>
                              {r.nr_ticket}
                            </td>
                            <td style={td}>
                              <div style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '13px' }}>{r.product_name}</div>
                              <div style={{ color: '#4B5563', fontSize: '11px' }}>#{(r.order_id||'').slice(0,8).toUpperCase()}</div>
                            </td>
                            <td style={{ ...td, color: '#9CA3AF', fontSize: '12px', maxWidth: '200px' }}>
                              {(r.descriere || '—').slice(0, 55)}{r.descriere?.length > 55 ? '…' : ''}
                            </td>
                            <td style={{ ...td, fontSize: '12px', maxWidth: '180px' }}>
                              {r.pickup_address ? (
                                <div style={{ color: '#D1D5DB', lineHeight: '1.5' }}>
                                  <div style={{ fontWeight: '500' }}>{r.pickup_address.full_name}</div>
                                  <div style={{ color: '#6B7280', fontSize: '11px' }}>{r.pickup_address.street}, {r.pickup_address.city}</div>
                                </div>
                              ) : <span style={{ color: '#4B5563' }}>—</span>}
                            </td>
                            <td style={{ ...td, color: '#CE93D8', fontSize: '13px' }}>{r.contact_telefon}</td>
                            <td style={td}><Badge cfg={serviceStatusCfg} status={r.status} /></td>
                            {/* PRIORITY DROPDOWN */}
                            <td style={{ ...td, position: 'relative' }}>
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                  onClick={() => setPriorityDropOpen(priorityDropOpen === pdKey ? null : pdKey)}
                                  style={{ ...PRIORITY_CFG[r.priority||'normal'], fontSize: '10px', padding: '3px 10px', borderRadius: '20px', background: PRIORITY_CFG[r.priority||'normal'].bg, color: PRIORITY_CFG[r.priority||'normal'].color, border: `1px solid ${PRIORITY_CFG[r.priority||'normal'].color}66`, fontWeight: '700', cursor: 'pointer' }}
                                >
                                  {PRIORITY_CFG[r.priority||'normal'].label} ▾
                                </button>
                                {priorityDropOpen === pdKey && (
                                  <div style={{ position: 'absolute', top: '26px', left: 0, background: '#111827', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', zIndex: 50, minWidth: '120px', padding: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                                    {['normal','ridicat','urgent'].map(p => (
                                      <button key={p} onClick={() => handleSetPriority('service', r.id, p)}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: r.priority===p ? `${PRIORITY_CFG[p].color}18` : 'transparent', color: PRIORITY_CFG[p].color, border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: r.priority===p ? '700' : '400' }}>
                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: PRIORITY_CFG[p].color, display: 'inline-block', flexShrink: 0 }} />
                                        {PRIORITY_CFG[p].label} {r.priority===p ? '✓' : ''}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            {/* NOTES BUTTON */}
                            <td style={td}>
                              <button onClick={() => toggleNotes('service', r.id)}
                                style={{ background: notesOpen ? 'rgba(14,246,255,0.12)' : 'rgba(14,246,255,0.06)', border: `1px solid ${notesOpen ? 'rgba(14,246,255,0.4)' : 'rgba(14,246,255,0.15)'}`, color: '#0EF6FF', fontSize: '10px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                <ChatCircle size={11} style={{ display: 'inline', marginRight: '4px' }} />
                                {notes.length > 0 ? notes.length : '+'} {notes.length === 1 ? 'notă' : 'note'}
                              </button>
                            </td>
                            <td style={{ ...td, color: '#6B7280', fontSize: '12px' }}>
                              {new Date(r.created_at).toLocaleDateString('ro-RO')}
                            </td>
                            <td style={td}>
                              <select value={r.status} onChange={e => handleUpdateServiceStatus(r.id, e.target.value)}
                                className="input-field text-[11px] cursor-pointer" style={{ minWidth: '140px' }}>
                                {[
                                  { v: 'in_asteptare',     l: 'In asteptare' },
                                  { v: 'va_veni_curierul', l: 'Va veni curierul' },
                                  { v: 'in_diagnosticare', l: 'In diagnosticare' },
                                  { v: 'piesa_comandata',  l: 'Piesa comandata' },
                                  { v: 'in_service',       l: 'In service' },
                                  { v: 'rezolvat',         l: 'Rezolvat' },
                                  { v: 'respins',          l: 'Respins' },
                                ].map(s => (
                                  <option key={s.v} value={s.v} style={{ background: '#0A0E1A' }}>{s.l}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                          {notesOpen && (
                            <tr key={r.id + '_notes'}>
                              <td colSpan={10} style={{ padding: '0' }}>
                                <NotesPanel
                                  notes={notes}
                                  noteText={noteText}
                                  setNoteText={setNoteText}
                                  onSave={() => saveNote('service', r.id)}
                                  saving={noteSaving}
                                />
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            RETURURI
        ══════════════════════════════════════════════════════ */}
        {section === 'retururi' && (
          <div>
            <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '20px' }}>
              Retururi <span style={{ color: '#4B5563', fontSize: '14px', fontWeight: '400' }}>({retururi.length} total)</span>
            </h1>
            <div style={tableWrap}>
              {retururi.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#4B5563', padding: '48px' }}>Nu exista cereri de retur</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Produs', 'Comanda', 'Motiv', 'Stare produs', 'Adresa ridicare', 'Rambursare', 'Status', 'Prioritate', 'Note', 'Data', 'Schimba'].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {retururi.map(r => {
                      const pdKey = `retur-${r.id}`
                      const notesKey = `retur-${r.id}`
                      const notes = notesByEntity[notesKey] || []
                      const notesOpen = openNotesFor === notesKey
                      return (
                        <>
                          <tr key={r.id} className="transition-colors hover:bg-white/[0.02]">
                            <td style={td}>
                              <div style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '13px' }}>{r.product_name}</div>
                            </td>
                            <td style={{ ...td, color: '#6B7280', fontFamily: 'monospace', fontSize: '11px' }}>
                              #{(r.order_id||'').slice(0,8).toUpperCase()}
                            </td>
                            <td style={{ ...td, color: '#9CA3AF', fontSize: '12px' }}>{r.motiv}</td>
                            <td style={{ ...td, color: '#CE93D8', fontSize: '12px' }}>{r.stare_produs}</td>
                            <td style={{ ...td, fontSize: '12px', maxWidth: '160px' }}>
                              {r.pickup_address ? (
                                <div style={{ color: '#D1D5DB', lineHeight: '1.5' }}>
                                  <div style={{ fontWeight: '500' }}>{r.pickup_address.full_name}</div>
                                  <div style={{ color: '#6B7280', fontSize: '11px' }}>{r.pickup_address.city}</div>
                                </div>
                              ) : <span style={{ color: '#4B5563' }}>—</span>}
                            </td>
                            <td style={{ ...td, fontSize: '12px' }}>
                              <div style={{ color: '#F1F5F9' }}>{r.refund_method === 'card' ? 'Card' : 'IBAN'}</div>
                              {r.iban && <div style={{ color: '#6B7280', fontSize: '11px', fontFamily: 'monospace' }}>{r.iban}</div>}
                            </td>
                            <td style={td}><Badge cfg={returStatusCfg} status={r.status} /></td>
                            {/* PRIORITY DROPDOWN */}
                            <td style={{ ...td, position: 'relative' }}>
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <button
                                  onClick={() => setPriorityDropOpen(priorityDropOpen === pdKey ? null : pdKey)}
                                  style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '20px', background: PRIORITY_CFG[r.priority||'normal'].bg, color: PRIORITY_CFG[r.priority||'normal'].color, border: `1px solid ${PRIORITY_CFG[r.priority||'normal'].color}66`, fontWeight: '700', cursor: 'pointer' }}
                                >
                                  {PRIORITY_CFG[r.priority||'normal'].label} ▾
                                </button>
                                {priorityDropOpen === pdKey && (
                                  <div style={{ position: 'absolute', top: '26px', left: 0, background: '#111827', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', zIndex: 50, minWidth: '120px', padding: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                                    {['normal','ridicat','urgent'].map(p => (
                                      <button key={p} onClick={() => handleSetPriority('retur', r.id, p)}
                                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', background: r.priority===p ? `${PRIORITY_CFG[p].color}18` : 'transparent', color: PRIORITY_CFG[p].color, border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: r.priority===p ? '700' : '400' }}>
                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: PRIORITY_CFG[p].color, display: 'inline-block', flexShrink: 0 }} />
                                        {PRIORITY_CFG[p].label} {r.priority===p ? '✓' : ''}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            {/* NOTES BUTTON */}
                            <td style={td}>
                              <button onClick={() => toggleNotes('retur', r.id)}
                                style={{ background: notesOpen ? 'rgba(14,246,255,0.12)' : 'rgba(14,246,255,0.06)', border: `1px solid ${notesOpen ? 'rgba(14,246,255,0.4)' : 'rgba(14,246,255,0.15)'}`, color: '#0EF6FF', fontSize: '10px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                <ChatCircle size={11} style={{ display: 'inline', marginRight: '4px' }} />
                                {notes.length > 0 ? notes.length : '+'} {notes.length === 1 ? 'notă' : 'note'}
                              </button>
                            </td>
                            <td style={{ ...td, color: '#6B7280', fontSize: '12px' }}>
                              {new Date(r.created_at).toLocaleDateString('ro-RO')}
                            </td>
                            <td style={td}>
                              <select value={r.status} onChange={e => handleUpdateReturStatus(r.id, e.target.value)}
                                className="input-field text-xs py-1 px-2 cursor-pointer">
                                {['in_asteptare','aprobat','respins','finalizat'].map(s => (
                                  <option key={s} value={s} style={{ background: '#0A0E1A' }}>{s}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                          {notesOpen && (
                            <tr key={r.id + '_notes'}>
                              <td colSpan={11} style={{ padding: '0' }}>
                                <NotesPanel
                                  notes={notes}
                                  noteText={noteText}
                                  setNoteText={setNoteText}
                                  onSave={() => saveNote('retur', r.id)}
                                  saving={noteSaving}
                                />
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            CLIENTI
        ══════════════════════════════════════════════════════ */}
        {section === 'clients' && (
          <div>
            <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '20px' }}>
              Clienti <span style={{ color: '#4B5563', fontSize: '14px', fontWeight: '400' }}>({uniqueClients.length} unici)</span>
            </h1>
            <div style={tableWrap}>
              {uniqueClients.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#4B5563', padding: '48px' }}>Nu exista clienti</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Client', 'Oras', 'Telefon', 'Comenzi', 'Total cheltuit', 'Detalii'].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueClients.map(c => (
                      <>
                        <tr key={c.user_id} className="transition-colors hover:bg-white/[0.02]">
                          <td style={td}>
                            <div style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '13px' }}>{c.name}</div>
                            <div style={{ color: '#4B5563', fontSize: '11px', fontFamily: 'monospace' }}>{c.user_id.slice(0,12)}…</div>
                          </td>
                          <td style={{ ...td, color: '#9CA3AF', fontSize: '13px' }}>{c.city}</td>
                          <td style={{ ...td, color: '#CE93D8', fontSize: '13px' }}>{c.phone}</td>
                          <td style={{ ...td, color: 'var(--cyan)', fontWeight: '700' }}>{c.orders.length}</td>
                          <td style={{ ...td, color: '#00E676', fontWeight: '700' }}>{c.totalSpent.toFixed(2)} RON</td>
                          <td style={td}>
                            <button onClick={() => {
                              if (selectedClient?.user_id === c.user_id) { setSelectedClient(null); return }
                              setSelectedClient(c)
                              setClientHistoryTab('orders')
                              loadClientHistory(c.user_id)
                            }}
                              style={{ background: selectedClient?.user_id === c.user_id ? 'rgba(206,147,216,0.15)' : 'rgba(206,147,216,0.08)', border: '1px solid rgba(206,147,216,0.3)', color: '#CE93D8', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                              {selectedClient?.user_id === c.user_id ? '▲ Ascunde' : '▼ 360°'}
                            </button>
                          </td>
                        </tr>
                        {selectedClient?.user_id === c.user_id && (() => {
                          const hist = clientHistory[c.user_id]
                          const totalSpentHist = hist ? hist.orders.reduce((s, o) => s + o.total_price, 0) : c.totalSpent
                          return (
                            <tr key={c.user_id + '_detail'}>
                              <td colSpan={6} style={{ padding: '0' }}>
                                <div style={{ background: 'rgba(206,147,216,0.04)', borderTop: '1px solid rgba(206,147,216,0.1)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px' }}>
                                  {/* Header + stats */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '14px' }}>
                                    <span style={{ color: '#CE93D8', fontWeight: '700', fontSize: '13px' }}>Profil 360° — {c.name}</span>
                                    <span style={{ color: '#9CA3AF', fontSize: '11px' }}>{c.orders.length} comenzi • {(hist?.retururi||[]).length} retururi • {(hist?.service||[]).length} service</span>
                                    <span style={{ color: '#00E676', fontWeight: '700', fontSize: '13px', marginLeft: 'auto' }}>{totalSpentHist.toFixed(2)} RON total</span>
                                  </div>
                                  {/* Tabs */}
                                  <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
                                    {[
                                      { key: 'orders',  label: `Comenzi (${(hist?.orders||c.orders).length})` },
                                      { key: 'retururi',label: `Retururi (${(hist?.retururi||[]).length})` },
                                      { key: 'service', label: `Service (${(hist?.service||[]).length})` },
                                    ].map(t => (
                                      <button key={t.key} onClick={() => setClientHistoryTab(t.key)}
                                        style={{ background: clientHistoryTab === t.key ? 'rgba(206,147,216,0.2)' : 'transparent', border: clientHistoryTab === t.key ? '1px solid rgba(206,147,216,0.4)' : '1px solid transparent', color: clientHistoryTab === t.key ? '#CE93D8' : '#6B7280', padding: '5px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', transition: 'all 0.15s' }}>
                                        {t.label}
                                      </button>
                                    ))}
                                  </div>
                                  {/* Content */}
                                  {loadingHistory && !hist && (
                                    <div style={{ color: '#4B5563', fontSize: '12px', padding: '12px' }}>Se încarcă...</div>
                                  )}
                                  {clientHistoryTab === 'orders' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {(hist?.orders || c.orders).map(o => (
                                        <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px 14px' }}>
                                          <div>
                                            <span style={{ color: '#0EF6FF', fontFamily: 'monospace', fontSize: '11px', fontWeight: '700' }}>{o.invoice_number || '#' + o.id.slice(0,8).toUpperCase()}</span>
                                            <span style={{ color: '#6B7280', fontSize: '11px', marginLeft: '10px' }}>{new Date(o.created_at).toLocaleDateString('ro-RO')}</span>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Badge cfg={orderStatusCfg} status={o.status} />
                                            <span style={{ color: '#00E676', fontWeight: '700', fontSize: '13px' }}>{parseFloat(o.total_price||0).toFixed(2)} RON</span>
                                          </div>
                                        </div>
                                      ))}
                                      {!(hist?.orders || c.orders).length && <div style={{ color: '#4B5563', fontSize: '12px', padding: '8px' }}>Nicio comandă</div>}
                                    </div>
                                  )}
                                  {clientHistoryTab === 'retururi' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {(hist?.retururi||[]).map(r => (
                                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px 14px' }}>
                                          <div>
                                            <span style={{ color: '#F1F5F9', fontSize: '12px' }}>{r.product_name}</span>
                                            <span style={{ color: '#6B7280', fontSize: '11px', marginLeft: '10px' }}>{r.motiv}</span>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <PriorityBadge priority={r.priority} />
                                            <Badge cfg={returStatusCfg} status={r.status} />
                                          </div>
                                        </div>
                                      ))}
                                      {!(hist?.retururi||[]).length && <div style={{ color: '#4B5563', fontSize: '12px', padding: '8px' }}>Niciun retur</div>}
                                    </div>
                                  )}
                                  {clientHistoryTab === 'service' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {(hist?.service||[]).map(s => (
                                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px 14px' }}>
                                          <div>
                                            <span style={{ color: '#0EF6FF', fontFamily: 'monospace', fontSize: '11px', fontWeight: '700' }}>{s.nr_ticket}</span>
                                            <span style={{ color: '#F1F5F9', fontSize: '12px', marginLeft: '10px' }}>{s.product_name}</span>
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <PriorityBadge priority={s.priority} />
                                            <Badge cfg={serviceStatusCfg} status={s.status} />
                                          </div>
                                        </div>
                                      ))}
                                      {!(hist?.service||[]).length && <div style={{ color: '#4B5563', fontSize: '12px', padding: '8px' }}>Nicio cerere service</div>}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })()}
                      </>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            RECENZII
        ══════════════════════════════════════════════════════ */}
        {section === 'reviews' && (() => {
          const pendingRev  = adminReviews.filter(r => !r.is_approved && !r.rejection_reason)
          const approvedRev = adminReviews.filter(r => r.is_approved)
          const rejectedRev = adminReviews.filter(r => !r.is_approved && r.rejection_reason)
          const byStatus = reviewFilter === 'pending' ? pendingRev
                         : reviewFilter === 'approved' ? approvedRev : rejectedRev
          const displayed = reviewVerifFilter === 'verified'   ? byStatus.filter(r => r.is_verified)
                          : reviewVerifFilter === 'unverified' ? byStatus.filter(r => !r.is_verified)
                          : byStatus

          const handleApprove = async () => {
            if (!approveTarget) return
            try {
              await reviewsAPI.approve(approveTarget, approveVerified)
              setAdminReviews(prev => prev.map(r =>
                r.id === approveTarget
                  ? { ...r, is_approved: true, rejection_reason: null, is_verified: approveVerified }
                  : r
              ))
              setApproveTarget(null)
              flash('Review aprobat!')
            } catch { flash('Eroare la aprobare', false) }
          }

          const handleReject = async () => {
            if (!rejectReason.trim()) return
            try {
              await reviewsAPI.reject(rejectTarget, rejectReason.trim())
              setAdminReviews(prev => prev.map(r => r.id === rejectTarget ? { ...r, is_approved: false, rejection_reason: rejectReason.trim() } : r))
              setRejectTarget(null); setRejectReason('')
              flash('Review respins.')
            } catch { flash('Eroare la respingere', false) }
          }

          const handleDelete = async (id) => {
            if (!window.confirm('Stergi definitiv acest review?')) return
            try {
              await reviewsAPI.remove(id)
              setAdminReviews(prev => prev.filter(r => r.id !== id))
              flash('Review sters.')
            } catch { flash('Eroare la stergere', false) }
          }

          const tabBtn = (key, label, count) => (
            <button onClick={() => setReviewFilter(key)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 cursor-pointer bg-transparent transition-colors ${
                reviewFilter === key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-secondary'
              }`}
            >
              {label} ({count})
            </button>
          )

          return (
            <div>
              <h1 style={{ color: '#F1F5F9', fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>Recenzii</h1>
              <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '16px' }}>Modereaza recenziile trimise de clienti</p>

              {/* Status tabs */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {tabBtn('pending',  'In asteptare', pendingRev.length)}
                {tabBtn('approved', 'Aprobate',     approvedRev.length)}
                {tabBtn('rejected', 'Respinse',     rejectedRev.length)}
              </div>

              {/* Verified sub-filter */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
                {[
                  { key: 'all',        label: `Toate (${byStatus.length})` },
                  { key: 'verified',   label: `Cumpărători verificați (${byStatus.filter(r=>r.is_verified).length})` },
                  { key: 'unverified', label: `Neverificați (${byStatus.filter(r=>!r.is_verified).length})` },
                ].map(f => (
                  <button key={f.key} onClick={() => setReviewVerifFilter(f.key)}
                    style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                      background: reviewVerifFilter === f.key ? 'rgba(14,246,255,0.12)' : 'transparent',
                      color: reviewVerifFilter === f.key ? '#0EF6FF' : '#6B7280',
                      borderColor: reviewVerifFilter === f.key ? 'rgba(14,246,255,0.4)' : 'rgba(255,255,255,0.08)',
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* List */}
              {displayed.length === 0 ? (
                <div style={{ ...tableWrap, padding: '48px', textAlign: 'center', color: '#4B5563' }}>
                  Nu exista recenzii in aceasta categorie.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {displayed.map(r => (
                    <div key={r.id}>
                      <div style={{
                        ...tableWrap, padding: '18px 20px',
                        borderLeft: r.is_approved ? '3px solid #00E676'
                                  : r.rejection_reason ? '3px solid #FF5252'
                                  : '3px solid #FF9800',
                      }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                {[1,2,3,4,5].map(s => (
                                  <span key={s} style={{ fontSize: '14px', color: s <= r.rating ? 'var(--amber)' : 'rgba(255,255,255,0.1)' }}>★</span>
                                ))}
                              </div>
                              <span style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '13px' }}>{r.author_name}</span>
                              {r.is_verified ? (
                                <span style={{ background: 'rgba(0,230,118,0.1)', color: '#00E676', border: '1px solid rgba(0,230,118,0.3)', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>
                                  Cumpărător verificat
                                </span>
                              ) : (
                                <span style={{ background: 'rgba(107,114,128,0.1)', color: '#6B7280', border: '1px solid rgba(107,114,128,0.2)', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                                  Neverificat
                                </span>
                              )}
                              {/* Client button */}
                              {r.user_id && !r.is_anonymous && (
                                <button
                                  onClick={() => {
                                    if (reviewClientOpen === r.id) { setReviewClientOpen(null); return }
                                    setReviewClientOpen(r.id)
                                    setClientHistoryTab('orders')
                                    loadClientHistory(r.user_id)
                                  }}
                                  style={{ background: reviewClientOpen === r.id ? 'rgba(206,147,216,0.15)' : 'rgba(206,147,216,0.08)', border: '1px solid rgba(206,147,216,0.3)', color: '#CE93D8', fontSize: '10px', padding: '2px 10px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}>
                                  <Users size={10} style={{ display: 'inline', marginRight: '4px' }} />
                                  {reviewClientOpen === r.id ? 'Ascunde client' : 'Vezi client 360°'}
                                </button>
                              )}
                            </div>
                            <div style={{ color: '#4B5563', fontSize: '12px' }}>
                              Produs: <span style={{ color: '#9CA3AF' }}>{r.product_name}</span>
                              &nbsp;·&nbsp;
                              {new Date(r.created_at).toLocaleDateString('ro-RO', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            {!r.is_approved && (
                              <button
                                onClick={() => { setApproveTarget(r.id); setApproveVerified(r.is_verified || false) }}
                                className="bg-success/10 border border-success/30 text-success px-3 py-1 rounded-lg cursor-pointer text-xs font-bold hover:bg-success/20 transition-colors flex items-center gap-1"
                              >
                                <Check size={12} /> Aproba
                              </button>
                            )}
                            {!r.rejection_reason && (
                              <button onClick={() => { setRejectTarget(r.id); setRejectReason('') }} className="bg-danger/10 border border-danger/30 text-danger px-3 py-1 rounded-lg cursor-pointer text-xs font-bold flex items-center gap-1">
                                <X size={12} /> Respinge
                              </button>
                            )}
                            <button onClick={() => handleDelete(r.id)} className="bg-white/5 border border-white/10 text-muted px-2.5 py-1 rounded-lg cursor-pointer text-xs flex items-center">
                              <Trash size={13} />
                            </button>
                          </div>
                        </div>
                        {r.title && <p style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '14px', margin: '0 0 6px' }}>{r.title}</p>}
                        {r.comment && <p style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: '1.7', margin: 0 }}>{r.comment}</p>}
                        {r.rejection_reason && (
                          <div style={{ marginTop: '10px', background: 'rgba(255,82,82,0.06)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: '8px', padding: '10px 14px' }}>
                            <span style={{ color: '#FF5252', fontSize: '12px', fontWeight: '700' }}>Motiv respingere: </span>
                            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{r.rejection_reason}</span>
                          </div>
                        )}

                        {/* Client 360° panel */}
                        {reviewClientOpen === r.id && r.user_id && (() => {
                          const hist = clientHistory[r.user_id]
                          return (
                            <div style={{ marginTop: '14px', borderTop: '1px solid rgba(206,147,216,0.15)', paddingTop: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                                <span style={{ color: '#CE93D8', fontWeight: '700', fontSize: '12px' }}>
                                  Profil 360° — {r.user_name || r.author_name}
                                </span>
                                {hist && (
                                  <span style={{ color: '#6B7280', fontSize: '11px' }}>
                                    {hist.orders.length} comenzi · {hist.retururi.length} retururi · {hist.service.length} service
                                    <span style={{ color: '#00E676', fontWeight: '700', marginLeft: '10px' }}>
                                      {hist.orders.reduce((s,o) => s + o.total_price, 0).toFixed(2)} RON total
                                    </span>
                                  </span>
                                )}
                              </div>
                              {/* Tabs */}
                              <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
                                {[
                                  { key: 'orders',   label: `Comenzi (${(hist?.orders||[]).length})` },
                                  { key: 'retururi', label: `Retururi (${(hist?.retururi||[]).length})` },
                                  { key: 'service',  label: `Service (${(hist?.service||[]).length})` },
                                ].map(t => (
                                  <button key={t.key} onClick={() => setClientHistoryTab(t.key)}
                                    style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                                      background: clientHistoryTab === t.key ? 'rgba(206,147,216,0.2)' : 'transparent',
                                      color: clientHistoryTab === t.key ? '#CE93D8' : '#6B7280',
                                      borderColor: clientHistoryTab === t.key ? 'rgba(206,147,216,0.4)' : 'transparent',
                                    }}>
                                    {t.label}
                                  </button>
                                ))}
                              </div>
                              {loadingHistory && !hist && <div style={{ color: '#4B5563', fontSize: '12px' }}>Se încarcă...</div>}
                              {hist && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                  {clientHistoryTab === 'orders' && (hist.orders.length === 0
                                    ? <div style={{ color: '#4B5563', fontSize: '12px' }}>Nicio comandă</div>
                                    : hist.orders.map(o => (
                                      <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '7px', padding: '8px 12px' }}>
                                        <span style={{ color: '#0EF6FF', fontFamily: 'monospace', fontSize: '11px', fontWeight: '700' }}>{o.invoice_number || '#'+o.id.slice(0,8).toUpperCase()}</span>
                                        <span style={{ color: '#6B7280', fontSize: '11px' }}>{new Date(o.created_at).toLocaleDateString('ro-RO')}</span>
                                        <Badge cfg={orderStatusCfg} status={o.status} />
                                        <span style={{ color: '#00E676', fontWeight: '700', fontSize: '12px' }}>{parseFloat(o.total_price).toFixed(2)} RON</span>
                                      </div>
                                    ))
                                  )}
                                  {clientHistoryTab === 'retururi' && (hist.retururi.length === 0
                                    ? <div style={{ color: '#4B5563', fontSize: '12px' }}>Niciun retur</div>
                                    : hist.retururi.map(rv => (
                                      <div key={rv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '7px', padding: '8px 12px' }}>
                                        <span style={{ color: '#F1F5F9', fontSize: '12px' }}>{rv.product_name}</span>
                                        <PriorityBadge priority={rv.priority} />
                                        <Badge cfg={returStatusCfg} status={rv.status} />
                                      </div>
                                    ))
                                  )}
                                  {clientHistoryTab === 'service' && (hist.service.length === 0
                                    ? <div style={{ color: '#4B5563', fontSize: '12px' }}>Nicio cerere service</div>
                                    : hist.service.map(sv => (
                                      <div key={sv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '7px', padding: '8px 12px' }}>
                                        <span style={{ color: '#0EF6FF', fontFamily: 'monospace', fontSize: '11px', fontWeight: '700' }}>{sv.nr_ticket}</span>
                                        <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{sv.product_name}</span>
                                        <PriorityBadge priority={sv.priority} />
                                        <Badge cfg={serviceStatusCfg} status={sv.status} />
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal respingere */}
              {approveTarget && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 3000,
                  background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={e => { if (e.target === e.currentTarget) setApproveTarget(null) }}>
                  <div style={{
                    background: '#0D1421', borderRadius: '16px',
                    border: '1px solid rgba(0,230,118,0.3)',
                    padding: '28px', width: '400px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
                  }}>
                    <h3 style={{ color: '#F1F5F9', fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Aproba review</h3>
                    <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '20px' }}>
                      Alege statutul de verificare înainte de publicare.
                    </p>

                    {/* Toggle verified */}
                    <div
                      onClick={() => setApproveVerified(v => !v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        background: approveVerified ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${approveVerified ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '12px', padding: '14px 16px', cursor: 'pointer',
                        transition: 'all 0.15s', marginBottom: '20px', userSelect: 'none',
                      }}
                    >
                      {/* Switch */}
                      <div style={{
                        width: '40px', height: '22px', borderRadius: '11px', flexShrink: 0,
                        background: approveVerified ? '#00E676' : 'rgba(255,255,255,0.1)',
                        position: 'relative', transition: 'background 0.2s',
                      }}>
                        <div style={{
                          position: 'absolute', top: '3px',
                          left: approveVerified ? '21px' : '3px',
                          width: '16px', height: '16px', borderRadius: '50%',
                          background: 'white', transition: 'left 0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }} />
                      </div>
                      <div>
                        <div style={{ color: approveVerified ? '#00E676' : '#9CA3AF', fontWeight: '700', fontSize: '13px' }}>
                          {approveVerified ? 'Cumpărător verificat' : 'Neverificat'}
                        </div>
                        <div style={{ color: '#4B5563', fontSize: '11px', marginTop: '2px' }}>
                          {approveVerified
                            ? 'Review-ul va apărea cu badge verde "Cumpărător verificat"'
                            : 'Review-ul va apărea fără badge de verificare'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setApproveTarget(null)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#6B7280', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Anulează</button>
                      <button onClick={handleApprove} style={{ background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.4)', color: '#00E676', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Check size={14} /> Publică review
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {rejectTarget && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 3000,
                  background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={e => { if (e.target === e.currentTarget) setRejectTarget(null) }}>
                  <div style={{
                    background: '#0D1421', borderRadius: '16px',
                    border: '1px solid rgba(255,82,82,0.3)',
                    padding: '28px', width: '420px',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
                  }}>
                    <h3 style={{ color: '#F1F5F9', fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Respinge review</h3>
                    <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '16px' }}>Scrie motivul respingerii:</p>
                    <textarea
                      value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                      rows={3} placeholder="Ex: Continut inadecvat, spam, off-topic..."
                      className="input-field" style={{ resize: 'vertical', marginBottom: '16px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setRejectTarget(null)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#6B7280', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Anuleaza</button>
                      <button onClick={handleReject} style={{ background: 'rgba(255,82,82,0.15)', border: '1px solid rgba(255,82,82,0.4)', color: '#FF5252', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}>Respinge review</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* ══════════════════════════════════════════════════════
            VOUCHERE
        ══════════════════════════════════════════════════════ */}
        {section === 'vouchers' && (() => {
          const handleCreateVoucher = async () => {
            if (!voucherForm.code.trim() || !voucherForm.type) return
            setVoucherSaving(true)
            try {
              const payload = {
                code: voucherForm.code.trim().toUpperCase(),
                type: voucherForm.type,
                value: voucherForm.value ? parseFloat(voucherForm.value) : null,
                description: voucherForm.description || null,
                min_order_amount: voucherForm.min_order_amount ? parseFloat(voucherForm.min_order_amount) : null,
                category_id: voucherForm.category_id || null,
                user_id: (!voucherTargetAll && voucherForm.user_id) ? voucherForm.user_id : null,
                usage_limit: voucherForm.usage_limit ? parseInt(voucherForm.usage_limit) : null,
                expires_at: (voucherHasExpiry && voucherForm.expires_at) ? voucherForm.expires_at : null,
              }
              const res = await vouchersAPI.adminCreate(payload)
              setAdminVouchers(prev => [res.data, ...prev])
              setVoucherForm({ code: '', type: 'percent', value: '', description: '', min_order_amount: '', category_id: '', user_id: '', usage_limit: '', expires_at: '' })
              setVoucherTargetAll(true)
              setVoucherHasExpiry(false)
              setShowVoucherForm(false)
              flash('Voucher creat cu succes!')
            } catch (err) { flash('Eroare: ' + (err.response?.data?.detail || 'necunoscuta'), false) }
            finally { setVoucherSaving(false) }
          }

          const handleToggleVoucher = async (v) => {
            try {
              const res = await vouchersAPI.adminUpdate(v.id, { is_active: !v.is_active })
              setAdminVouchers(prev => prev.map(x => x.id === v.id ? res.data : x))
            } catch { flash('Eroare.', false) }
          }

          const handleDeleteVoucher = async (id) => {
            if (!window.confirm('Stergi voucher-ul?')) return
            try {
              await vouchersAPI.adminDelete(id)
              setAdminVouchers(prev => prev.filter(x => x.id !== id))
              flash('Voucher sters.')
            } catch { flash('Eroare la stergere.', false) }
          }

          const openEdit = (v) => {
            setEditVoucher(v)
            setEditVoucherTargetAll(!v.user_id)
            setEditVoucherHasExpiry(!!v.expires_at)
            setEditVoucherForm({
              type: v.type,
              value: v.value ?? '',
              description: v.description ?? '',
              min_order_amount: v.min_order_amount ?? '',
              category_id: v.category_id ?? '',
              user_id: v.user_id ?? '',
              usage_limit: v.usage_limit ?? '',
              expires_at: v.expires_at ? new Date(v.expires_at).toISOString().slice(0, 16) : '',
            })
          }

          const handleSaveEdit = async () => {
            setVoucherSaving(true)
            try {
              const payload = {
                type: editVoucherForm.type,
                value: editVoucherForm.value !== '' ? parseFloat(editVoucherForm.value) : null,
                description: editVoucherForm.description || null,
                min_order_amount: editVoucherForm.min_order_amount !== '' ? parseFloat(editVoucherForm.min_order_amount) : null,
                category_id: editVoucherForm.category_id || null,
                user_id: (!editVoucherTargetAll && editVoucherForm.user_id) ? editVoucherForm.user_id : null,
                usage_limit: editVoucherForm.usage_limit !== '' ? parseInt(editVoucherForm.usage_limit) : null,
                expires_at: (editVoucherHasExpiry && editVoucherForm.expires_at) ? editVoucherForm.expires_at : null,
              }
              const res = await vouchersAPI.adminUpdate(editVoucher.id, payload)
              setAdminVouchers(prev => prev.map(x => x.id === editVoucher.id ? res.data : x))
              setEditVoucher(null)
              flash('Voucher actualizat!')
            } catch (err) { flash('Eroare: ' + (err.response?.data?.detail || 'necunoscuta'), false) }
            finally { setVoucherSaving(false) }
          }

          const lbl = { color: '#6B7280', fontSize: '11px', display: 'block', marginBottom: '4px' }

          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#F1F5F9', fontSize: '20px', fontWeight: '700', margin: 0 }}>
                  Vouchere ({adminVouchers.length})
                </h2>
                <button onClick={() => setShowVoucherForm(v => !v)} className="btn-primary flex items-center gap-1.5 text-sm">
                  {showVoucherForm ? (
                    <><X size={13} /> Anuleaza</>
                  ) : <><PlusCircle size={14} /> Voucher nou</>}
                </button>
              </div>

              {/* Form creare */}
              {showVoucherForm && (
                <div style={{
                  background: 'rgba(66,165,245,0.05)', border: '1px solid rgba(66,165,245,0.2)',
                  borderRadius: '14px', padding: '24px', marginBottom: '24px',
                }}>
                  <h3 style={{ color: 'var(--cyan)', fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>
                    Voucher nou
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={lbl}>Cod *</label>
                      <input className="input-field" value={voucherForm.code} onChange={e => setVoucherForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="ex: SUMMER20" />
                    </div>
                    <div>
                      <label style={lbl}>Tip *</label>
                      <select className="input-field cursor-pointer" value={voucherForm.type} onChange={e => setVoucherForm(f => ({ ...f, type: e.target.value }))}>
                        <option value="percent">Procent (%)</option>
                        <option value="fixed">Suma fixa (RON)</option>
                        <option value="free_shipping">Transport gratuit</option>
                      </select>
                    </div>
                    {voucherForm.type !== 'free_shipping' && (
                      <div>
                        <label style={lbl}>{voucherForm.type === 'percent' ? 'Valoare (%)' : 'Valoare (RON)'} *</label>
                        <input className="input-field" type="number" value={voucherForm.value} onChange={e => setVoucherForm(f => ({ ...f, value: e.target.value }))} placeholder={voucherForm.type === 'percent' ? '10' : '50'} />
                      </div>
                    )}
                    <div>
                      <label style={lbl}>Comanda minima (RON)</label>
                      <input className="input-field" type="number" value={voucherForm.min_order_amount} onChange={e => setVoucherForm(f => ({ ...f, min_order_amount: e.target.value }))} placeholder="200" />
                    </div>
                    <div>
                      <label style={lbl}>Limita utilizari</label>
                      <input className="input-field" type="number" value={voucherForm.usage_limit} onChange={e => setVoucherForm(f => ({ ...f, usage_limit: e.target.value }))} placeholder="nelimitat" />
                    </div>
                    <div>
                      <label style={lbl}>Expirare</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => setVoucherHasExpiry(false)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid', fontSize: '12px', fontWeight: '600', cursor: 'pointer', borderColor: !voucherHasExpiry ? 'var(--cyan)' : 'rgba(255,255,255,0.1)', background: !voucherHasExpiry ? 'rgba(14,246,255,0.1)' : 'rgba(255,255,255,0.03)', color: !voucherHasExpiry ? 'var(--cyan)' : '#6B7280' }}>Permanent</button>
                        <button type="button" onClick={() => setVoucherHasExpiry(true)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid', fontSize: '12px', fontWeight: '600', cursor: 'pointer', borderColor: voucherHasExpiry ? 'var(--cyan)' : 'rgba(255,255,255,0.1)', background: voucherHasExpiry ? 'rgba(14,246,255,0.1)' : 'rgba(255,255,255,0.03)', color: voucherHasExpiry ? 'var(--cyan)' : '#6B7280' }}>Cu data expirare</button>
                      </div>
                      {voucherHasExpiry && (
                        <input className="input-field" style={{ colorScheme: 'dark', marginTop: '6px' }} type="datetime-local" value={voucherForm.expires_at} onChange={e => setVoucherForm(f => ({ ...f, expires_at: e.target.value }))} />
                      )}
                    </div>
                    <div>
                      <label style={lbl}>Categorie (optional)</label>
                      <select className="input-field cursor-pointer" value={voucherForm.category_id} onChange={e => setVoucherForm(f => ({ ...f, category_id: e.target.value }))}>
                        <option value="">Toate categoriile</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Destinatar</label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                        <button type="button" onClick={() => setVoucherTargetAll(true)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid', fontSize: '12px', fontWeight: '600', cursor: 'pointer', borderColor: voucherTargetAll ? 'var(--cyan)' : 'rgba(255,255,255,0.1)', background: voucherTargetAll ? 'rgba(14,246,255,0.1)' : 'rgba(255,255,255,0.03)', color: voucherTargetAll ? 'var(--cyan)' : '#6B7280' }}>Toti clientii</button>
                        <button type="button" onClick={() => setVoucherTargetAll(false)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid', fontSize: '12px', fontWeight: '600', cursor: 'pointer', borderColor: !voucherTargetAll ? 'var(--cyan)' : 'rgba(255,255,255,0.1)', background: !voucherTargetAll ? 'rgba(14,246,255,0.1)' : 'rgba(255,255,255,0.03)', color: !voucherTargetAll ? 'var(--cyan)' : '#6B7280' }}>Client specific</button>
                      </div>
                      {!voucherTargetAll && (
                        <select className="input-field cursor-pointer" value={voucherForm.user_id} onChange={e => setVoucherForm(f => ({ ...f, user_id: e.target.value }))}>
                          <option value="">Selecteaza client...</option>
                          {voucherClients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
                        </select>
                      )}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={lbl}>Descriere (optional)</label>
                      <input className="input-field" value={voucherForm.description} onChange={e => setVoucherForm(f => ({ ...f, description: e.target.value }))} placeholder="ex: Reducere de vara 20%" />
                    </div>
                  </div>
                  <button onClick={handleCreateVoucher} disabled={voucherSaving || !voucherForm.code.trim()} className="btn-primary flex items-center gap-1.5 disabled:opacity-60">
                    {voucherSaving ? <><CircleNotch size={14} className="animate-spin" /> Se salveaza...</> : <><Check size={14} /> Creeaza voucher</>}
                  </button>
                </div>
              )}

              {/* Lista vouchere */}
              {adminVouchers.length === 0 ? (
                <p style={{ color: '#4B5563', fontSize: '14px', textAlign: 'center', padding: '40px' }}>
                  Niciun voucher creat inca.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {adminVouchers.map(v => {
                    const expired = v.expires_at && new Date(v.expires_at) < new Date()
                    return (
                      <div key={v.id} style={{
                        background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px 20px',
                        border: `1px solid ${!v.is_active || expired ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)'}`,
                        opacity: !v.is_active || expired ? 0.6 : 1,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                              <span style={{ color: '#F1F5F9', fontWeight: '800', fontSize: '16px', fontFamily: 'monospace', letterSpacing: '1px' }}>
                                {v.code}
                              </span>
                              <span style={{
                                fontSize: '11px', padding: '2px 8px', borderRadius: '8px', fontWeight: '700',
                                background: v.type === 'percent' ? 'rgba(206,147,216,0.12)' : v.type === 'fixed' ? 'rgba(0,212,255,0.12)' : 'rgba(0,230,118,0.1)',
                                color: v.type === 'percent' ? '#CE93D8' : v.type === 'fixed' ? 'var(--cyan)' : '#00E676',
                                border: `1px solid ${v.type === 'percent' ? 'rgba(206,147,216,0.3)' : v.type === 'fixed' ? 'rgba(0,212,255,0.3)' : 'rgba(0,230,118,0.3)'}`,
                              }}>
                                {v.type === 'percent' ? `${v.value}%` : v.type === 'fixed' ? `${v.value} RON` : 'Transport gratuit'}
                              </span>
                              {!v.is_active && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,82,82,0.1)', color: '#FF5252', border: '1px solid rgba(255,82,82,0.3)' }}>Inactiv</span>}
                              {expired && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(255,152,0,0.1)', color: '#FF9800', border: '1px solid rgba(255,152,0,0.3)' }}>Expirat</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                              {v.description && <span style={{ color: '#9CA3AF', fontSize: '12px' }}>{v.description}</span>}
                              {v.min_order_amount && <span style={{ color: '#6B7280', fontSize: '12px' }}>Min: {v.min_order_amount} RON</span>}
                              {v.category_name && <span style={{ color: '#6B7280', fontSize: '12px' }}>Categorie: {v.category_name}</span>}
                              {v.user_name && <span style={{ color: '#6B7280', fontSize: '12px' }}>Client: {v.user_name}</span>}
                              {!v.user_name && !v.user_id && <span style={{ color: '#6B7280', fontSize: '12px' }}>Toti clientii</span>}
                              <span style={{ color: '#6B7280', fontSize: '12px' }}>
                                Utilizat: {v.used_count}{v.usage_limit ? `/${v.usage_limit}` : ''} ori
                              </span>
                              {v.expires_at && <span style={{ color: '#6B7280', fontSize: '12px' }}>Expira: {new Date(v.expires_at).toLocaleDateString('ro-RO')}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <button onClick={() => openEdit(v)} className="flex items-center gap-1 bg-accent/10 border border-accent/30 text-accent px-3 py-1 rounded-lg cursor-pointer text-xs font-semibold hover:bg-accent/20 transition-colors">
                              <PencilSimple size={12} /> Editeaza
                            </button>
                            <button onClick={() => handleToggleVoucher(v)} style={{
                              background: v.is_active ? 'rgba(255,82,82,0.1)' : 'rgba(0,230,118,0.1)',
                              border: `1px solid ${v.is_active ? 'rgba(255,82,82,0.3)' : 'rgba(0,230,118,0.3)'}`,
                              color: v.is_active ? '#FF5252' : '#00E676',
                              padding: '5px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                            }}>
                              {v.is_active ? 'Dezactiveaza' : 'Activeaza'}
                            </button>
                            <button onClick={() => handleDeleteVoucher(v.id)} className="flex items-center bg-white/[0.04] border border-white/10 text-muted px-2.5 py-1 rounded-lg cursor-pointer text-xs">
                              <Trash size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            {/* Modal editare voucher */}
            {editVoucher && (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 3000,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
              }} onClick={e => { if (e.target === e.currentTarget) setEditVoucher(null) }}>
                <div style={{
                  background: '#0F172A', borderRadius: '16px', padding: '28px',
                  border: '1px solid rgba(255,255,255,0.12)', width: '100%', maxWidth: '600px',
                  maxHeight: '90vh', overflowY: 'auto',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ color: '#F1F5F9', fontSize: '17px', fontWeight: '700', margin: 0 }}>
                      Editeaza voucher — <span style={{ color: 'var(--cyan)', fontFamily: 'monospace' }}>{editVoucher.code}</span>
                    </h3>
                    <button onClick={() => setEditVoucher(null)} style={{
                      background: 'none', border: 'none', color: '#6B7280',
                      fontSize: '20px', cursor: 'pointer', padding: '0 4px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <X size={18} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ color: '#6B7280', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Tip</label>
                      <select className="input-field cursor-pointer"
                        value={editVoucherForm.type} onChange={e => setEditVoucherForm(f => ({ ...f, type: e.target.value }))}>
                        <option value="percent">Procent (%)</option>
                        <option value="fixed">Suma fixa (RON)</option>
                        <option value="free_shipping">Transport gratuit</option>
                      </select>
                    </div>
                    {editVoucherForm.type !== 'free_shipping' && (
                      <div>
                        <label style={{ color: '#6B7280', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{editVoucherForm.type === 'percent' ? 'Valoare (%)' : 'Valoare (RON)'}</label>
                        <input className="input-field"
                          type="number" value={editVoucherForm.value} onChange={e => setEditVoucherForm(f => ({ ...f, value: e.target.value }))} />
                      </div>
                    )}
                    <div>
                      <label style={{ color: '#6B7280', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Comanda minima (RON)</label>
                      <input className="input-field"
                        type="number" value={editVoucherForm.min_order_amount} onChange={e => setEditVoucherForm(f => ({ ...f, min_order_amount: e.target.value }))} placeholder="fara limita" />
                    </div>
                    <div>
                      <label style={{ color: '#6B7280', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Limita utilizari</label>
                      <input className="input-field"
                        type="number" value={editVoucherForm.usage_limit} onChange={e => setEditVoucherForm(f => ({ ...f, usage_limit: e.target.value }))} placeholder="nelimitat" />
                    </div>
                    <div>
                      <label style={{ color: '#6B7280', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Categorie</label>
                      <select className="input-field cursor-pointer"
                        value={editVoucherForm.category_id} onChange={e => setEditVoucherForm(f => ({ ...f, category_id: e.target.value }))}>
                        <option value="">Toate categoriile</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ color: '#6B7280', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Destinatar</label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                        <button type="button" onClick={() => setEditVoucherTargetAll(true)} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid', fontSize: '11px', fontWeight: '600', cursor: 'pointer', borderColor: editVoucherTargetAll ? 'var(--cyan)' : 'rgba(255,255,255,0.1)', background: editVoucherTargetAll ? 'rgba(14,246,255,0.1)' : 'rgba(255,255,255,0.03)', color: editVoucherTargetAll ? 'var(--cyan)' : '#6B7280' }}>Toti clientii</button>
                        <button type="button" onClick={() => setEditVoucherTargetAll(false)} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid', fontSize: '11px', fontWeight: '600', cursor: 'pointer', borderColor: !editVoucherTargetAll ? 'var(--cyan)' : 'rgba(255,255,255,0.1)', background: !editVoucherTargetAll ? 'rgba(14,246,255,0.1)' : 'rgba(255,255,255,0.03)', color: !editVoucherTargetAll ? 'var(--cyan)' : '#6B7280' }}>Client specific</button>
                      </div>
                      {!editVoucherTargetAll && (
                        <select className="input-field cursor-pointer"
                          value={editVoucherForm.user_id} onChange={e => setEditVoucherForm(f => ({ ...f, user_id: e.target.value }))}>
                          <option value="">Selecteaza client...</option>
                          {voucherClients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.email}</option>)}
                        </select>
                      )}
                    </div>
                    <div>
                      <label style={{ color: '#6B7280', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Expirare</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" onClick={() => setEditVoucherHasExpiry(false)} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid', fontSize: '11px', fontWeight: '600', cursor: 'pointer', borderColor: !editVoucherHasExpiry ? 'var(--cyan)' : 'rgba(255,255,255,0.1)', background: !editVoucherHasExpiry ? 'rgba(14,246,255,0.1)' : 'rgba(255,255,255,0.03)', color: !editVoucherHasExpiry ? 'var(--cyan)' : '#6B7280' }}>Permanent</button>
                        <button type="button" onClick={() => setEditVoucherHasExpiry(true)} style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1px solid', fontSize: '11px', fontWeight: '600', cursor: 'pointer', borderColor: editVoucherHasExpiry ? 'var(--cyan)' : 'rgba(255,255,255,0.1)', background: editVoucherHasExpiry ? 'rgba(14,246,255,0.1)' : 'rgba(255,255,255,0.03)', color: editVoucherHasExpiry ? 'var(--cyan)' : '#6B7280' }}>Cu data expirare</button>
                      </div>
                      {editVoucherHasExpiry && (
                        <input className="input-field" style={{ colorScheme: 'dark', marginTop: '6px' }}
                          type="datetime-local" value={editVoucherForm.expires_at} onChange={e => setEditVoucherForm(f => ({ ...f, expires_at: e.target.value }))} />
                      )}
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: '#6B7280', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Descriere</label>
                      <input className="input-field"
                        value={editVoucherForm.description} onChange={e => setEditVoucherForm(f => ({ ...f, description: e.target.value }))} placeholder="Descriere voucher" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button onClick={() => setEditVoucher(null)} className="bg-transparent border border-white/10 text-muted px-5 py-2 rounded-lg cursor-pointer text-sm font-semibold hover:border-white/20 transition-colors">
                      Anuleaza
                    </button>
                    <button onClick={handleSaveEdit} disabled={voucherSaving} className="btn-primary flex items-center gap-1.5 disabled:opacity-60">
                      {voucherSaving ? <><CircleNotch size={14} className="animate-spin" /> Se salveaza...</> : <><Check size={14} /> Salveaza modificarile</>}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          )
        })()}

        {/* ══════════════════════════════════════════════════════
            ECHIPA / TEAM MANAGEMENT
        ══════════════════════════════════════════════════════ */}
        {section === 'team' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-primary font-display font-bold text-2xl flex items-center gap-2">
                  <IdentificationBadge size={26} weight="bold" className="text-accent" />
                  Gestionare Echipa
                </h2>
                <p className="text-muted text-sm mt-1">{teamMembers.length} angajati inregistrati</p>
              </div>
              <button onClick={() => setShowTeamForm(v => !v)} className={showTeamForm ? 'btn-outline' : 'btn-primary'}>
                {showTeamForm ? 'Anuleaza' : '+ Angajat nou'}
              </button>
            </div>

            {showTeamForm && (
              <form onSubmit={handleTeamCreate} className="bg-surface border border-accent/20 rounded-2xl p-6 mb-6">
                <h3 className="text-accent font-bold text-sm mb-4 flex items-center gap-2">
                  <UserCirclePlus size={16} /> Adauga angajat nou
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Nume complet', key: 'name', req: true },
                    { label: 'Email', key: 'email', type: 'email', req: true },
                    { label: 'Parola initiala', key: 'password', type: 'password', req: true },
                    { label: 'Telefon', key: 'phone' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                        {f.label} {f.req && <span className="text-danger">*</span>}
                      </label>
                      <input type={f.type || 'text'} required={f.req} value={teamForm[f.key]}
                        onChange={e => setTeamForm(p => ({ ...p, [f.key]: e.target.value }))} className="input-field" />
                    </div>
                  ))}
                  <div>
                    <label style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Rol *</label>
                    <select value={teamForm.role} onChange={e => setTeamForm(p => ({ ...p, role: e.target.value }))}
                      className="input-field cursor-pointer" required>
                      {['admin','manager','achizitii','marketing','suport'].map(r => (
                        <option key={r} value={r} style={{ background: '#0A0E1A' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" disabled={teamSaving} className="btn-primary flex items-center gap-2">
                  {teamSaving ? <CircleNotch size={14} className="animate-spin" /> : <Check size={14} />}
                  Creeaza cont
                </button>
              </form>
            )}

            <div className="bg-surface border border-default rounded-2xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-base-2 border-b border-default">
                    {['Angajat', 'Email', 'Rol', 'Telefon', 'Status', 'Ultima logare', 'Actiuni'].map(h => (
                      <th key={h} className="text-muted text-[11px] uppercase tracking-wider py-3 px-4 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-muted text-sm">Niciun angajat inregistrat inca.</td></tr>
                  ) : teamMembers.map(m => {
                    const roleColors = {
                      admin:     { bg: 'rgba(0,212,255,0.12)',   color: 'var(--cyan)', border: 'rgba(0,212,255,0.3)'   },
                      manager:   { bg: 'rgba(0,230,118,0.12)',   color: '#00E676',     border: 'rgba(0,230,118,0.3)'   },
                      achizitii: { bg: 'rgba(255,152,0,0.12)',   color: '#FF9800',     border: 'rgba(255,152,0,0.3)'   },
                      marketing: { bg: 'rgba(206,147,216,0.12)', color: '#CE93D8',     border: 'rgba(206,147,216,0.3)' },
                      suport:    { bg: 'rgba(79,195,247,0.12)',  color: '#4FC3F7',     border: 'rgba(79,195,247,0.3)'  },
                    }
                    const rc = roleColors[m.role] || { bg: 'rgba(156,163,175,0.12)', color: '#9CA3AF', border: 'rgba(156,163,175,0.3)' }
                    return (
                      <tr key={m.id} className={`border-b border-default/50 transition-colors ${!m.is_active ? 'opacity-50' : 'hover:bg-white/[0.02]'}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold shrink-0">
                              {m.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-primary text-sm font-semibold">{m.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-secondary text-sm">{m.email}</td>
                        <td className="py-3 px-4">
                          <span style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>
                            {m.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted text-sm">{m.phone || '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${m.is_active ? 'bg-success/15 text-success border border-success/30' : 'bg-danger/15 text-danger border border-danger/30'}`}>
                            {m.is_active ? 'Activ' : 'Inactiv'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted text-xs">
                          {m.last_login ? new Date(m.last_login).toLocaleDateString('ro-RO', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : 'Niciodata'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1.5">
                            <button onClick={() => { setEditMember(m); setEditMemberForm({ name: m.name, role: m.role, phone: m.phone || '' }) }}
                              className="bg-accent/10 border border-accent/20 text-accent text-xs px-2.5 py-1 rounded-lg cursor-pointer hover:bg-accent/20 transition-colors flex items-center gap-1">
                              <PencilSimple size={12} /> Edit
                            </button>
                            <button onClick={() => setDeleteConfirmMember(m)}
                              className="bg-danger/10 border border-danger/20 text-danger text-xs px-2.5 py-1 rounded-lg cursor-pointer hover:bg-danger/20 transition-colors flex items-center gap-1">
                              <Trash size={12} /> Sterge
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════
          MODAL EDITARE PRODUS
      ══════════════════════════════════════════════════════ */}
      {editProduct && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }} onClick={e => { if (e.target === e.currentTarget) { setEditProduct(null); setEditImages([]); setEditSpecRows([]) } }}>
          <div style={{
            background: '#0D1421', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            width: '100%', maxWidth: '660px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
            overflow: 'hidden', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(66,165,245,0.05)',
            }}>
              <h2 style={{ color: '#F1F5F9', fontSize: '16px', fontWeight: '700' }}>
                <PencilSimple size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Editeaza: {editProduct.name}
              </h2>
              <button onClick={() => { setEditProduct(null); setEditImages([]); setEditSpecRows([]) }} style={{
                background: 'transparent', border: 'none', color: '#6B7280', fontSize: '22px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {[
                  { label: 'Nume produs', key: 'name', req: true },
                  { label: 'Slug (auto)', key: 'slug' },
                  { label: 'Brand', key: 'brand' },
                  { label: 'Model', key: 'model' },
                  { label: 'SKU (cod intern)', key: 'sku' },
                  { label: 'Garantie (luni)', key: 'warranty_months', type: 'number' },
                  { label: 'Pret (RON)', key: 'price', type: 'number', req: true },
                  { label: 'Pret vechi (RON)', key: 'old_price', type: 'number' },
                  { label: 'Stoc', key: 'stock', type: 'number', req: true },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                    <input type={f.type || 'text'} value={editProduct[f.key] || ''}
                      onChange={e => setEditProduct({ ...editProduct, [f.key]: e.target.value })}
                      required={f.req} className="input-field"
                    />
                  </div>
                ))}
                <div>
                  <label style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Categorie</label>
                  <select value={editProduct.category_id || ''} onChange={e => setEditProduct({ ...editProduct, category_id: e.target.value })}
                    className="input-field cursor-pointer" required>
                    {categories.map(c => <option key={c.id} value={c.id} style={{ background: '#0A0E1A' }}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Descriere</label>
                  <textarea value={editProduct.description || ''} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })}
                    className="input-field" style={{ resize: 'vertical' }} rows={3} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ color: '#6B7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Specificatii tehnice</label>
                    <button type="button" onClick={() => setEditSpecRows([...editSpecRows, { key:'', value:'' }])} className="bg-success/10 border border-success/30 text-success px-2.5 py-0.5 rounded-lg cursor-pointer text-xs font-semibold">+ Adauga</button>
                  </div>
                  {editSpecRows.length === 0 && <p style={{ color: '#4B5563', fontSize: '13px', fontStyle: 'italic' }}>Nicio specificatie.</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {editSpecRows.map((row, i) => (
                      <div key={i} style={{ display: 'flex', gap: '6px' }}>
                        <input value={row.key} onChange={e => { const r=[...editSpecRows]; r[i]={...r[i],key:e.target.value}; setEditSpecRows(r) }}
                          placeholder="Cheie" className="input-field" style={{ flex: '1' }}
                        />
                        <input value={row.value} onChange={e => { const r=[...editSpecRows]; r[i]={...r[i],value:e.target.value}; setEditSpecRows(r) }}
                          placeholder="Valoare" className="input-field" style={{ flex: '2' }}
                        />
                        <button type="button" onClick={() => setEditSpecRows(editSpecRows.filter((_,j)=>j!==i))} className="bg-danger/10 border border-danger/30 text-danger w-9 h-9 rounded-lg cursor-pointer shrink-0 hover:bg-danger/20 transition-colors flex items-center justify-center">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Imagini */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <label style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Imagini produs
                </label>
                {editImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {editImages.map(img => (
                      <div key={img.id} style={{ position: 'relative' }}>
                        <img src={imgUrl(img.url)} alt={img.alt_text}
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', display: 'block' }}
                        />
                        <button type="button" onClick={() => handleDeleteImage(img.id)} style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          background: '#FF5252', color: 'white', border: 'none',
                          borderRadius: '50%', width: '20px', height: '20px',
                          cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {editImages.length === 0 && <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '10px' }}>Nicio imagine</p>}
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: imageUploading ? 'rgba(255,255,255,0.03)' : 'rgba(66,165,245,0.1)',
                  border: '1px solid rgba(66,165,245,0.3)',
                  color: imageUploading ? '#4B5563' : 'var(--cyan)',
                  padding: '8px 14px', borderRadius: '8px',
                  cursor: imageUploading ? 'default' : 'pointer', fontSize: '13px',
                }}>
                  {imageUploading ? (
                    <><CircleNotch size={14} className="animate-spin" /> Se incarca...</>
                  ) : (
                    <><Images size={14} /> Adauga imagine</>
                  )}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={imageUploading} />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                  <Check size={15} /> Salveaza modificarile
                </button>
                <button type="button" onClick={() => { setEditProduct(null); setEditImages([]); setEditSpecRows([]) }} style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#9CA3AF', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px',
                }}>Anuleaza</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal confirmare stergere angajat */}
      {deleteConfirmMember && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[1000] p-5">
          <div className="bg-base-1 border border-danger/30 rounded-2xl max-w-[420px] w-full shadow-elevated">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-danger/15 border border-danger/30 flex items-center justify-center mx-auto mb-4">
                <Trash size={26} weight="duotone" className="text-danger" />
              </div>
              <h3 className="text-primary font-bold text-lg mb-2">Stergi angajatul?</h3>
              <p className="text-muted text-sm mb-1">
                Esti sigur ca vrei sa stergi contul lui{' '}
                <span className="text-primary font-semibold">{deleteConfirmMember.name}</span>?
              </p>
              <p className="text-danger text-xs mb-6">Aceasta actiune este permanenta si nu poate fi anulata.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmMember(null)}
                  className="flex-1 bg-white/5 border border-white/10 text-secondary py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-white/10 transition-colors">
                  Anuleaza
                </button>
                <button
                  onClick={handleTeamDelete}
                  className="flex-1 bg-danger/90 hover:bg-danger text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors flex items-center justify-center gap-2">
                  <Trash size={14} /> Da, sterge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal edit angajat */}
      {editMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-5">
          <div className="bg-base-1 border border-default rounded-2xl max-w-[440px] w-full shadow-elevated">
            <div className="flex justify-between items-center px-6 py-4 border-b border-default">
              <h3 className="text-primary font-bold text-lg flex items-center gap-2">
                <PencilSimple size={16} className="text-accent" /> Editeaza angajat
              </h3>
              <button onClick={() => setEditMember(null)} className="text-muted hover:text-primary cursor-pointer bg-transparent border-none">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleTeamUpdate} className="p-6 flex flex-col gap-3">
              {[{ label: 'Nume complet', key: 'name' }, { label: 'Telefon', key: 'phone' }].map(f => (
                <div key={f.key}>
                  <label style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                  <input value={editMemberForm[f.key] || ''} onChange={e => setEditMemberForm(p => ({ ...p, [f.key]: e.target.value }))} className="input-field" />
                </div>
              ))}
              <div>
                <label style={{ color: '#6B7280', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Rol</label>
                <select value={editMemberForm.role || ''} onChange={e => setEditMemberForm(p => ({ ...p, role: e.target.value }))} className="input-field cursor-pointer">
                  {['admin','manager','achizitii','marketing','suport'].map(r => (
                    <option key={r} value={r} style={{ background: '#0A0E1A' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-1.5"><Check size={14} /> Salveaza</button>
                <button type="button" onClick={() => setEditMember(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer' }}>Anuleaza</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

/* ─── NOTES PANEL ────────────────────────────────────────────────── */
function NotesPanel({ notes, noteText, setNoteText, onSave, saving }) {
  return (
    <div style={{ background: 'rgba(14,246,255,0.03)', borderTop: '1px solid rgba(14,246,255,0.1)', padding: '14px 20px' }}>
      <div style={{ color: '#0EF6FF', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', marginBottom: '10px', textTransform: 'uppercase' }}>
        Note interne
      </div>
      {notes.length === 0 && (
        <div style={{ color: '#4B5563', fontSize: '12px', marginBottom: '10px' }}>Nicio notă încă.</div>
      )}
      {notes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          {notes.map(n => (
            <div key={n.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#0EF6FF', fontSize: '11px', fontWeight: '700' }}>{n.staff_name}</span>
                <span style={{ color: '#4B5563', fontSize: '10px' }}>
                  {new Date(n.created_at).toLocaleDateString('ro-RO')} {new Date(n.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>{n.note_text}</p>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSave()}
          placeholder="Adaugă o notă internă... (Enter pentru salvare)"
          style={{ flex: 1, background: '#0F1923', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', outline: 'none' }}
        />
        <button
          onClick={onSave}
          disabled={saving || !noteText.trim()}
          style={{ background: noteText.trim() ? '#0EF6FF' : 'rgba(14,246,255,0.15)', color: noteText.trim() ? '#050910' : '#4B5563', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '700', cursor: noteText.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
        >
          {saving ? '...' : 'Salvează'}
        </button>
      </div>
    </div>
  )
}
