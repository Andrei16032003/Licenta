import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ordersAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import {
  Package, ShoppingCart, CircleNotch, CaretDown,
  Receipt, Printer, CurrencyDollar, Truck,
} from '@phosphor-icons/react'

const statusConfig = {
  pending:    { className: 'bg-price-dim text-price border border-price-border',       label: 'În așteptare' },
  confirmed:  { className: 'bg-accent-dim text-accent border border-accent',           label: 'Confirmat' },
  processing: { className: 'bg-violet/15 text-violet border border-violet/30',         label: 'În procesare' },
  shipped:    { className: 'bg-price-dim text-price border border-price-border',       label: 'Expediat' },
  delivered:  { className: 'bg-success/15 text-success border border-success/30',      label: 'Livrat' },
  cancelled:  { className: 'bg-danger/15 text-danger border border-danger/30',         label: 'Anulat' },
}

export default function Orders() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [expandedId, setExpandedId]   = useState(null)
  const [details, setDetails]         = useState({})
  const [loadingDetail, setLoadingDetail] = useState(null)

  // factura
  const [invoiceOrder, setInvoiceOrder]     = useState(null)
  const [loadingInvoice, setLoadingInvoice] = useState(null)

  const successState = location.state?.success ? location.state : null

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    loadOrders()
    if (location.state?.orderId) setExpandedId(location.state.orderId)
  }, [isAuthenticated])

  const loadOrders = async () => {
    try {
      const res = await ordersAPI.getUserOrders(user.id)
      setOrders(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const toggleExpand = async (orderId) => {
    if (expandedId === orderId) { setExpandedId(null); return }
    setExpandedId(orderId)
    if (details[orderId]) return
    setLoadingDetail(orderId)
    try {
      const res = await ordersAPI.getById(orderId)
      setDetails(prev => ({ ...prev, [orderId]: res.data }))
    } catch (err) { console.error(err) }
    finally { setLoadingDetail(null) }
  }

  const openInvoice = async (e, orderId) => {
    e.stopPropagation()
    setLoadingInvoice(orderId)
    try {
      const res = await ordersAPI.getInvoice(orderId)
      setInvoiceOrder(res.data)
    } catch (err) { console.error(err) }
    finally { setLoadingInvoice(null) }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <CircleNotch size={32} className="animate-spin text-accent" />
    </div>
  )

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-primary text-[26px] font-bold flex items-center gap-2.5">
          <Package size={28} weight="bold" className="text-accent" />
          Comenzile mele
        </h1>
        <button onClick={() => navigate('/cart')} className="btn-primary flex items-center gap-2">
          <ShoppingCart size={16} weight="bold" />
          Comandă nouă
        </button>
      </div>

      {successState && (
        <div className="bg-success/10 border border-success/30 text-success rounded-xl px-4 py-3 mb-5 text-sm">
          Comandă plasată! Total: <strong>{successState.total} RON</strong>
          <br />
          <span className="text-muted text-xs">
            ID: #{successState.orderId?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-surface border border-default rounded-2xl py-16 text-center">
          <Package size={64} weight="duotone" className="ph-duotone text-muted mx-auto mb-4" />
          <p className="text-muted text-lg mb-5">Nu ai nicio comandă încă</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Mergi la catalog
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map(order => {
            const sc        = statusConfig[order.status] || statusConfig.pending
            const isExpanded = expandedId === order.id
            const detail    = details[order.id]

            return (
              <div
                key={order.id}
                className={`bg-surface border rounded-xl overflow-hidden shadow-card transition-colors ${isExpanded ? 'border-accent/25' : 'border-default'}`}
              >
                {/* Header */}
                <div onClick={() => toggleExpand(order.id)} className="p-5 cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-primary font-bold text-[15px] mb-0.5">
                        Comanda #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-muted text-xs">
                        {new Date(order.created_at).toLocaleDateString('ro-RO', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                        {order.invoice_number && (
                          <span className="text-muted ml-2">• {order.invoice_number}</span>
                        )}
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
                      <PayBadge status={order.payment_status} method={order.payment_method_type} />

                      {/* Buton factura */}
                      <button
                        onClick={e => openInvoice(e, order.id)}
                        disabled={loadingInvoice === order.id}
                        className="bg-base-2 border border-default text-secondary text-xs px-2.5 py-1 rounded-lg cursor-pointer hover:border-accent/40 hover:text-accent transition-colors flex items-center gap-1">
                        {loadingInvoice === order.id
                          ? <CircleNotch size={11} className="animate-spin" />
                          : <Receipt size={13} />
                        }
                        Factură
                      </button>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="font-mono font-extrabold text-xl text-price">
                        {order.total_price} RON
                      </span>
                      <CaretDown
                        size={16}
                        className={`text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
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
                        {/* Produse */}
                        <div>
                          <p className="text-muted text-[11px] uppercase tracking-wider mb-2.5">
                            Produse
                          </p>
                          <div className="flex flex-col gap-2">
                            {detail.items.map((item, i) => (
                              <div key={i} className="bg-base-2 rounded-lg p-2.5 flex justify-between items-center">
                                <div>
                                  <Link to={`/product/${item.product_id}`} className="no-underline hover:text-accent transition-colors">
                                  <p className="text-primary text-[13px] font-medium">{item.product_name}</p>
                                </Link>
                                  <p className="text-muted text-[11px]">{item.unit_price} RON × {item.quantity}</p>
                                </div>
                                <span className="text-price font-bold text-sm">{item.subtotal} RON</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Adresa + total */}
                        <div className="flex flex-col gap-3">
                          {detail.shipping_address && (
                            <div>
                              <p className="text-muted text-[11px] uppercase tracking-wider mb-2">
                                Adresă livrare
                              </p>
                              <div className="bg-surface rounded-lg p-3">
                                <p className="text-primary text-[13px] font-medium mb-0.5">
                                  {detail.shipping_address.full_name}
                                </p>
                                <p className="text-secondary text-xs">
                                  {detail.shipping_address.street}, {detail.shipping_address.city}
                                </p>
                                <p className="text-muted text-xs">
                                  {detail.shipping_address.county} {detail.shipping_address.postal_code}
                                </p>
                                <p className="text-muted text-xs">{detail.shipping_address.phone}</p>
                              </div>
                            </div>
                          )}

                          <div className="bg-surface rounded-lg p-3">
                            <TotRow label="Subtotal" value={`${detail.subtotal} RON`} />
                            <TotRow
                              label="Transport"
                              value={detail.shipping_cost === 0 ? 'Gratuit' : `${detail.shipping_cost} RON`}
                              green={detail.shipping_cost === 0}
                            />
                            {detail.cod_fee > 0 && (
                              <TotRow label="Taxă ramburs" value={`${detail.cod_fee} RON`} amber />
                            )}
                            <div className="border-t border-default/40 pt-1.5 mt-1">
                              <TotRow label="Total" value={`${detail.total_price} RON`} bold />
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
          })}
        </div>
      )}

      {/* Modal factura */}
      {invoiceOrder && (
        <InvoiceModal invoice={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}
    </div>
  )
}

// ── Invoice Modal ─────────────────────────────────────────────
function InvoiceModal({ invoice, onClose }) {
  const isProforma = invoice.type === 'proforma'

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1000] p-5">
      <div
        onClick={e => e.stopPropagation()}
        className="bg-base-1 border border-default rounded-2xl max-w-[680px] w-full max-h-[90vh] overflow-auto shadow-elevated">
        {/* Header factura */}
        <div className={`${isProforma ? 'bg-gradient-to-br from-accent-dim to-base-1' : 'bg-gradient-to-br from-success/10 to-base-1'} p-6 px-7 border-b border-default/40`}>
          <div className="flex justify-between items-start">
            <div>
              <p className={`${isProforma ? 'text-accent' : 'text-success'} text-[11px] font-bold uppercase tracking-widest mb-1`}>
                {isProforma ? 'FACTURĂ PROFORMĂ' : 'FACTURĂ FISCALĂ'}
              </p>
              <h2 className="text-primary text-[22px] font-extrabold mb-1">
                {invoice.invoice_number}
              </h2>
              <p className="text-muted text-[13px]">
                Data: {new Date(invoice.date).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-primary font-extrabold text-3xl">{invoice.total_price} RON</p>
              <PayBadge status={invoice.payment_status} method={invoice.payment_method_type} />
            </div>
          </div>
        </div>

        <div className="p-6 px-7">
          {/* Vanzator / Cumparator */}
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
              <p className="text-muted text-[10px] uppercase tracking-widest mb-2">Cumpărător</p>
              <p className="text-primary text-sm font-bold mb-1">{invoice.buyer.name}</p>
              <p className="text-secondary text-xs mb-0.5">{invoice.buyer.address}</p>
              {invoice.buyer.postal && <p className="text-secondary text-xs mb-0.5">Cod poștal: {invoice.buyer.postal}</p>}
              <p className="text-secondary text-xs">{invoice.buyer.phone}</p>
            </div>
          </div>

          {/* Tabel produse */}
          <div className="mb-5">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-base-2 border-b border-default">
                  {['Produs', 'Cant.', 'Preț unitar', 'TVA 19%', 'Total'].map(h => (
                    <th key={h} className={`text-muted text-[11px] uppercase tracking-wider py-2.5 px-3 ${h === 'Produs' ? 'text-left' : 'text-right'}`}>
                      {h}
                    </th>
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

          {/* Totaluri */}
          <div className="flex justify-end mb-5">
            <div className="min-w-[260px]">
              {invoice.shipping_cost > 0 && (
                <InvRow label="Transport" value={`${invoice.shipping_cost} RON`} />
              )}
              {invoice.cod_fee > 0 && (
                <InvRow label="Taxă ramburs" value={`${invoice.cod_fee} RON`} amber />
              )}
              <InvRow label="Bază impozabilă" value={`${invoice.total_net} RON`} />
              <InvRow label="TVA 19%" value={`${invoice.total_vat} RON`} />
              <div className="border-t border-default/40 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-primary font-bold text-sm">TOTAL</span>
                  <span className="text-price font-extrabold text-xl">{invoice.total_price} RON</span>
                </div>
              </div>
            </div>
          </div>

          {/* Date transfer (doar proforma) */}
          {isProforma && invoice.bank_details && (
            <div className="bg-accent-dim border border-accent/20 rounded-xl p-4 mb-5">
              <p className="text-accent font-bold text-[13px] mb-3 flex items-center gap-1.5">
                <CurrencyDollar size={14} />
                Date pentru transfer bancar
              </p>
              {[
                { label: 'Beneficiar', value: invoice.bank_details.beneficiar },
                { label: 'Bancă',      value: invoice.seller.bank },
                { label: 'IBAN',       value: invoice.bank_details.iban, mono: true },
                { label: 'Sumă',       value: `${invoice.bank_details.suma} RON`, bold: true },
                { label: 'Referință', value: invoice.bank_details.referinta, mono: true, amber: true },
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

          {/* Butoane */}
          <div className="flex gap-2.5 justify-end">
            <button
              onClick={() => window.print()}
              className="bg-base-2 border border-default text-secondary text-sm px-4 py-2 rounded-lg cursor-pointer hover:text-primary transition-colors flex items-center gap-1.5">
              <Printer size={14} />
              Printează
            </button>
            <button onClick={onClose} className="btn-primary flex items-center gap-1.5">
              Închide
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────
function PayBadge({ status }) {
  const map = {
    paid:             { className: 'bg-success/15 text-success border border-success/30',         text: 'Plătit' },
    cod:              { className: 'bg-price-dim text-price border border-price-border',           text: 'Ramburs' },
    pending_card:     { className: 'bg-violet/15 text-violet border border-violet/30',             text: 'Plată card' },
    pending_transfer: { className: 'bg-price-dim text-price border border-price-border',           text: 'Transfer' },
    unpaid:           { className: 'bg-base-2 text-muted border border-default',                   text: '—' },
  }
  const key = status === 'cod' ? 'cod' : status
  const cfg = map[key] || { className: 'bg-base-2 text-muted border border-default', text: status }
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${cfg.className}`}>
      {cfg.text}
    </span>
  )
}

function TotRow({ label, value, bold, green, amber }) {
  return (
    <div className="flex justify-between mb-1">
      <span className={`${bold ? 'text-primary font-bold text-[13px]' : 'text-muted text-xs'}`}>{label}</span>
      <span className={`${bold ? 'text-price font-bold text-[15px]' : amber ? 'text-price text-xs' : green ? 'text-success text-xs' : 'text-secondary text-xs'}`}>
        {value}
      </span>
    </div>
  )
}

function InvRow({ label, value, amber }) {
  return (
    <div className="flex justify-between mb-1.5">
      <span className="text-muted text-[13px]">{label}</span>
      <span className={`text-[13px] ${amber ? 'text-price' : 'text-secondary'}`}>{value}</span>
    </div>
  )
}
