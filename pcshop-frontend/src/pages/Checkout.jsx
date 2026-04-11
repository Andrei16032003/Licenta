import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, CreditCard, User, EnvelopeSimple, Phone,
  Check, CircleNotch, Warning, Lock, ShoppingBag,
  Tag, ArrowRight,
} from '@phosphor-icons/react'
import { cartAPI, ordersAPI, profileAPI, vouchersAPI } from '../services/api'
import useAuthStore from '../store/authStore'

const PAYMENT_OPTIONS = [
  {
    value: 'cod',
    label: 'Ramburs la livrare',
    desc: 'Platesti cash la primirea coletului',
    badge: '+5 RON taxa',
  },
  {
    value: 'card',
    label: 'Card online',
    desc: 'Visa / Mastercard — procesare instant',
    badge: null,
  },
  {
    value: 'transfer',
    label: 'Transfer bancar',
    desc: 'Primesti factura proforma, trimiti banii, comanda se proceseaza dupa confirmare',
    badge: null,
  },
]

export default function Checkout() {
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  const [cart, setCart]                       = useState({ items: [], total_items: 0, total_price: 0 })
  const [addresses, setAddresses]             = useState([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [paymentMethod, setPaymentMethod]     = useState('cod')
  const [notes, setNotes]                     = useState('')
  const [loading, setLoading]                 = useState(true)
  const [placing, setPlacing]                 = useState(false)
  const [error, setError]                     = useState('')

  // voucher
  const [voucherInput, setVoucherInput]       = useState('')
  const [voucher, setVoucher]                 = useState(null)
  const [voucherError, setVoucherError]       = useState('')
  const [voucherLoading, setVoucherLoading]   = useState(false)

  // dupa plasare comanda
  const [step, setStep]               = useState('checkout')
  const [placedOrder, setPlacedOrder] = useState(null)

  // card form
  const [card, setCard]               = useState({ number: '', expiry: '', cvv: '', name: '' })
  const [cardError, setCardError]     = useState('')
  const [cardLoading, setCardLoading] = useState(false)
  const [cardSuccess, setCardSuccess] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return }
    Promise.all([
      cartAPI.get(user.id),
      profileAPI.getAddresses(user.id),
    ]).then(([cartRes, addrRes]) => {
      const cartData = cartRes.data
      if (!cartData.items?.length) { navigate('/cart'); return }
      setCart(cartData)
      setAddresses(addrRes.data)
      const def = addrRes.data.find(a => a.is_default) || addrRes.data[0]
      if (def) setSelectedAddress(def.id)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [isAuthenticated])

  const codFee   = paymentMethod === 'cod' ? 5 : 0
  const shipping = (voucher?.free_shipping || parseFloat(cart.total_price) >= 500) ? 0 : 19.99
  const discount = voucher?.discount || 0
  const total    = (parseFloat(cart.total_price) - discount + shipping + codFee).toFixed(2)

  // Valideaza codul voucher introdus si calculeaza reducerea aplicabila
  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return
    setVoucherError(''); setVoucherLoading(true)
    try {
      const res = await vouchersAPI.validate({
        code: voucherInput.trim(),
        user_id: user.id,
        subtotal: parseFloat(cart.total_price),
      })
      setVoucher(res.data)
    } catch (err) {
      setVoucherError(err.response?.data?.detail || 'Cod invalid.')
      setVoucher(null)
    } finally { setVoucherLoading(false) }
  }

  // Plaseaza comanda si redirectioneaza in functie de metoda de plata aleasa
  const handleConfirm = async () => {
    if (!selectedAddress) { setError('Selecteaza o adresa de livrare!'); return }
    setError(''); setPlacing(true)
    try {
      const res = await ordersAPI.create({
        user_id: user.id,
        address_id: selectedAddress,
        payment_method_type: paymentMethod,
        notes: notes || undefined,
        voucher_code: voucher?.code || undefined,
      })
      setPlacedOrder(res.data)

      if (paymentMethod === 'card') {
        setStep('pay-card')
      } else if (paymentMethod === 'transfer') {
        setStep('transfer-info')
      } else {
        navigate('/orders', { state: { success: true, orderId: res.data.order_id, total: res.data.total_price } })
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Eroare la plasarea comenzii.')
    } finally { setPlacing(false) }
  }

  // Trimite datele cardului si proceseaza plata; redirectioneaza dupa succes
  const handleCardPay = async () => {
    setCardError(''); setCardLoading(true)
    try {
      await ordersAPI.payCard(placedOrder.order_id, {
        card_number: card.number,
        expiry:      card.expiry,
        cvv:         card.cvv,
        cardholder:  card.name,
      })
      setCardSuccess(true)
      setTimeout(() => navigate('/orders', {
        state: { success: true, orderId: placedOrder.order_id, total: placedOrder.total_price }
      }), 2000)
    } catch (err) {
      setCardError(err.response?.data?.detail || 'Eroare la procesarea platii.')
    } finally { setCardLoading(false) }
  }

  // Formateaza numarul de card in grupuri de 4 cifre (ex: 4242 4242 4242 4242)
  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  // Formateaza data expirarii cardului in formatul MM/YY
  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-muted text-lg gap-3">
      <CircleNotch size={24} className="animate-spin" />
      <span>Se incarca...</span>
    </div>
  )

  // ─── STEP 2: Card payment form ────────────────────────────
  if (step === 'pay-card') {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="font-display font-bold text-primary text-2xl mb-2 flex items-center gap-2">
          <CreditCard size={24} className="text-accent" />
          Plata cu cardul
        </h1>
        <p className="text-muted text-sm mb-6">
          Comanda #{placedOrder?.order_id?.slice(0, 8).toUpperCase()} —{' '}
          <strong className="text-price">{placedOrder?.total_price} RON</strong>
        </p>

        {/* Hint carduri test */}
        <div className="bg-accent-dim border border-accent-border rounded-xl px-4 py-3 mb-5 text-xs">
          <p className="text-accent font-semibold mb-2">Carduri de test:</p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-secondary">
                <code className="text-success">4242 4242 4242 4242</code> — plata reusita
              </span>
              <button
                onClick={() => setCard({ number: '4242 4242 4242 4242', expiry: '12/28', cvv: '123', name: 'TEST USER' })}
                className="text-success border border-success/30 bg-success/10 px-2.5 py-0.5 rounded-md font-semibold text-xs cursor-pointer hover:bg-success/20 transition-colors whitespace-nowrap flex-shrink-0">
                Foloseste
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-secondary">
                <code className="text-danger">4000 0000 0000 0002</code> — refuzat
              </span>
              <button
                onClick={() => setCard({ number: '4000 0000 0000 0002', expiry: '12/28', cvv: '123', name: 'TEST USER' })}
                className="text-danger border border-danger/30 bg-danger/10 px-2.5 py-0.5 rounded-md font-semibold text-xs cursor-pointer hover:bg-danger/20 transition-colors whitespace-nowrap flex-shrink-0">
                Foloseste
              </button>
            </div>
          </div>
          <p className="text-muted mt-1.5">CVV: orice 3 cifre, Expiry: orice data viitoare</p>
        </div>

        {cardSuccess ? (
          <div className="bg-surface border border-default rounded-2xl p-7 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-success" />
            </div>
            <p className="text-success font-bold text-lg">Plata procesata cu succes!</p>
            <p className="text-muted text-sm mt-2">Redirectionam la comenzile tale...</p>
          </div>
        ) : (
          <div className="bg-surface border border-default rounded-2xl p-7">
            {/* Card visual */}
            <div className="rounded-2xl p-5 mb-6 bg-gradient-to-br from-blue-900 via-blue-950 to-indigo-950 shadow-elevated min-h-28 relative">
              <p className="text-white/50 text-xs mb-4 tracking-widest">CARD DE CREDIT / DEBIT</p>
              <p className="font-mono text-white text-lg tracking-widest mb-4">
                {card.number || '•••• •••• •••• ••••'}
              </p>
              <div className="flex justify-between">
                <div>
                  <p className="text-white/50 text-xs mb-0.5">TITULAR</p>
                  <p className="text-white text-sm">{card.name || 'NUME PRENUME'}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-xs mb-0.5">EXPIRA</p>
                  <p className="text-white text-sm">{card.expiry || 'MM/YY'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-muted text-xs block mb-1.5">Numar card</label>
                <input
                  value={card.number}
                  onChange={e => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-muted text-xs block mb-1.5">Titular card</label>
                <input
                  value={card.name}
                  onChange={e => setCard({ ...card, name: e.target.value.toUpperCase() })}
                  placeholder="NUME PRENUME"
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted text-xs block mb-1.5">Data expirare</label>
                  <input
                    value={card.expiry}
                    onChange={e => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-muted text-xs block mb-1.5">CVV</label>
                  <input
                    value={card.cvv}
                    onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                    placeholder="•••"
                    maxLength={3}
                    type="password"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {cardError && (
              <div className="flex items-center gap-2 text-danger text-sm mt-3.5 bg-danger/5 px-3 py-2.5 rounded-lg border border-danger/20">
                <Warning size={15} />
                {cardError}
              </div>
            )}

            <button
              onClick={handleCardPay}
              disabled={cardLoading || !card.number || !card.expiry || !card.cvv || !card.name}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-5 disabled:opacity-50 disabled:cursor-not-allowed">
              {cardLoading
                ? <><CircleNotch size={16} className="animate-spin" /> Se proceseaza...</>
                : <><Lock size={15} /> Plateste {placedOrder?.total_price} RON</>}
            </button>

            <p className="text-muted text-xs text-center mt-2.5 flex items-center justify-center gap-1">
              <Lock size={11} /> Conexiune securizata SSL — datele sunt criptate
            </p>
          </div>
        )}
      </div>
    )
  }

  // ─── STEP 2: Transfer bancar ─────────────────────────────
  if (step === 'transfer-info') {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="font-display font-bold text-primary text-2xl mb-2">
          Transfer bancar
        </h1>
        <p className="text-muted text-sm mb-6">
          Comanda a fost inregistrata. Trimite plata la datele de mai jos.
        </p>

        <div className="bg-success/5 border border-success/25 rounded-xl px-4 py-3 mb-5">
          <p className="text-success font-semibold text-sm mb-1 flex items-center gap-1.5">
            <Check size={14} />
            Comanda #{placedOrder?.order_id?.slice(0, 8).toUpperCase()} inregistrata
          </p>
          <p className="text-muted text-xs">
            Factura proforma: <strong className="text-primary">{placedOrder?.invoice_number}</strong>
          </p>
        </div>

        <div className="bg-surface border border-default rounded-2xl p-6 mb-4">
          <h3 className="text-primary font-bold text-base mb-4">Date transfer</h3>
          {[
            { label: 'Beneficiar', value: 'PCShop SRL' },
            { label: 'Banca',      value: 'ING Bank Romania' },
            { label: 'IBAN',       value: 'RO49INGB0000999901234567', mono: true },
            { label: 'Suma',       value: `${placedOrder?.total_price} RON`, bold: true, price: true },
            { label: 'Referinta', value: placedOrder?.order_id?.slice(0, 8).toUpperCase(), mono: true },
          ].map(row => (
            <div key={row.label} className="flex justify-between items-center py-2.5 border-b border-default last:border-0">
              <span className="text-muted text-sm">{row.label}</span>
              <span className={`text-sm ${row.mono ? 'font-mono' : ''} ${row.bold ? 'font-bold' : 'font-medium'} ${row.price ? 'text-price' : 'text-primary'}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-surface border border-default rounded-xl px-4 py-3 mb-5 text-sm">
          <p className="text-primary font-semibold mb-1 flex items-center gap-1.5">
            <Warning size={14} className="text-price" />
            Important
          </p>
          <p className="text-muted text-xs">
            Comanda va fi procesata dupa confirmarea platii de catre echipa noastra (1-2 zile lucratoare).
            Factura fiscala va fi emisa dupa confirmare.
          </p>
        </div>

        <button
          onClick={() => navigate('/orders', {
            state: { success: true, orderId: placedOrder?.order_id, total: placedOrder?.total_price }
          })}
          className="btn-primary w-full flex items-center justify-center gap-2">
          Mergi la comenzile mele
          <ArrowRight size={15} />
        </button>
      </div>
    )
  }

  // ─── STEP 1: Checkout form ────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display font-bold text-primary text-2xl mb-2">
        Finalizeaza comanda
      </h1>
      <p className="text-muted text-sm mb-7">
        Verifica produsele, alege adresa si metoda de plata
      </p>

      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 320px', alignItems: 'start' }}>

        {/* LEFT */}
        <div className="flex flex-col gap-4">

          {/* Produse */}
          <Section icon={<ShoppingBag size={18} className="text-accent" />} title="Produse in cos">
            <div className="flex flex-col gap-2.5">
              {cart.items.map(item => (
                <div key={item.cart_item_id} className="flex gap-3.5 items-center p-3 rounded-xl bg-base-2 border border-default">
                  <div className="product-img-bg w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <ShoppingBag size={22} className="text-muted" />
                  </div>
                  <div className="flex-1">
                    <p className="text-primary font-semibold text-sm mb-0.5">{item.name}</p>
                    <p className="text-muted text-xs">{item.brand}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-secondary text-xs">x{item.quantity}</p>
                    <p className="font-mono font-bold text-price text-sm">{item.subtotal} RON</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Adresa */}
          <Section icon={<MapPin size={18} className="text-accent" />} title="Adresa de livrare">
            {addresses.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-secondary text-sm mb-3">Nu ai nicio adresa salvata.</p>
                <button onClick={() => navigate('/profile')} className="btn-primary">
                  Adauga adresa in Profil
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {addresses.map(addr => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddress(addr.id)}
                    className={`border rounded-xl p-3.5 cursor-pointer transition-all duration-200 ${
                      selectedAddress === addr.id
                        ? 'border-accent-border bg-accent-dim'
                        : 'border-default bg-base-2 hover:border-accent-border'
                    }`}>
                    <div className="flex justify-between mb-1">
                      <span className="text-primary font-semibold text-sm flex items-center gap-1.5">
                        <MapPin size={13} className="text-accent" />
                        {addr.label}
                      </span>
                      <div className="flex gap-1.5">
                        {addr.is_default && <Badge text="Default" color="accent" />}
                        {selectedAddress === addr.id && (
                          <span className="flex items-center gap-1 text-xs text-success font-semibold">
                            <Check size={12} /> Selectat
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-secondary text-xs mb-0.5">{addr.full_name} — {addr.phone}</p>
                    <p className="text-muted text-xs">{addr.street}, {addr.city}, {addr.county}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Metoda plata */}
          <Section icon={<CreditCard size={18} className="text-accent" />} title="Metoda de plata">
            <div className="flex flex-col gap-2.5">
              {PAYMENT_OPTIONS.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setPaymentMethod(opt.value)}
                  className={`border rounded-xl p-3.5 cursor-pointer flex gap-3.5 items-center transition-all duration-200 ${
                    paymentMethod === opt.value
                      ? 'border-accent-border bg-accent-dim'
                      : 'border-default bg-base-2 hover:border-accent-border'
                  }`}>
                  <CreditCard size={22} className={paymentMethod === opt.value ? 'text-accent' : 'text-muted'} />
                  <div className="flex-1">
                    <div className="flex gap-2 items-center mb-0.5">
                      <p className="text-primary font-semibold text-sm">{opt.label}</p>
                      {opt.badge && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-price/10 text-price border border-price/20">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-muted text-xs">{opt.desc}</p>
                  </div>
                  {paymentMethod === opt.value && (
                    <Check size={18} className="text-success flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* Note */}
          <Section icon={<User size={18} className="text-accent" />} title="Mentiuni (optional)">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Instructiuni speciale pentru livrare..."
              rows={3}
              className="input-field resize-y w-full"
            />
          </Section>
        </div>

        {/* RIGHT – sumar */}
        <div className="bg-surface border border-default rounded-2xl p-6 sticky top-6">
          <h2 className="font-display font-bold text-primary text-lg mb-5">
            Sumar comanda
          </h2>

          {/* Voucher input */}
          <div className="mb-3.5">
            {voucher ? (
              <div className="bg-success/5 border border-success/25 rounded-xl px-3.5 py-2.5 flex justify-between items-center">
                <div>
                  <p className="text-success font-bold text-sm flex items-center gap-1.5">
                    <Tag size={13} />
                    {voucher.code}
                    {voucher.type === 'percent' && ` — ${voucher.value}% reducere`}
                    {voucher.type === 'fixed' && ` — ${voucher.value} RON reducere`}
                    {voucher.type === 'free_shipping' && ' — Transport gratuit'}
                  </p>
                  <p className="text-muted text-xs">{voucher.description || 'Voucher aplicat'}</p>
                </div>
                <button
                  onClick={() => { setVoucher(null); setVoucherInput('') }}
                  className="text-danger hover:text-danger/80 transition-colors cursor-pointer text-base px-1">
                  &times;
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      value={voucherInput}
                      onChange={e => { setVoucherInput(e.target.value.toUpperCase()); setVoucherError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleApplyVoucher()}
                      placeholder="Cod voucher"
                      className="input-field pl-8"
                    />
                  </div>
                  <button
                    onClick={handleApplyVoucher}
                    disabled={voucherLoading || !voucherInput.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                    {voucherLoading ? <CircleNotch size={14} className="animate-spin" /> : 'Aplica'}
                  </button>
                </div>
                {voucherError && (
                  <div className="flex items-center gap-1.5 text-danger text-xs mt-1.5">
                    <Warning size={13} />
                    {voucherError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Linii sumar */}
          <div className="flex flex-col gap-0 mb-4">
            <div className="flex justify-between text-sm text-secondary py-1">
              <span>Produse ({cart.total_items})</span>
              <span className="font-semibold">{cart.total_price} RON</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-secondary py-1">
                <span>Reducere ({voucher?.code})</span>
                <span className="font-semibold text-success">-{discount.toFixed(2)} RON</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-secondary py-1">
              <span>Transport</span>
              <span className={`font-semibold ${shipping === 0 ? 'text-success' : ''}`}>
                {shipping === 0 ? 'Gratuit' : `${shipping} RON`}
              </span>
            </div>
            {codFee > 0 && (
              <div className="flex justify-between text-sm text-secondary py-1">
                <span>Taxa ramburs</span>
                <span className="font-semibold text-price">+{codFee} RON</span>
              </div>
            )}
            <div className="flex justify-between font-mono font-extrabold text-2xl text-price border-t border-default pt-3 mt-2">
              <span className="font-display font-bold text-primary text-base">Total</span>
              <span>{total} RON</span>
            </div>
          </div>

          {shipping > 0 && !voucher?.free_shipping && (
            <p className="text-success text-xs mb-3.5 bg-success/5 px-3 py-2 rounded-lg border border-success/20">
              Mai adauga {(500 - parseFloat(cart.total_price)).toFixed(2)} RON pentru transport gratuit!
            </p>
          )}

          {paymentMethod === 'transfer' && (
            <p className="text-muted text-xs mb-3.5 bg-base-2 px-3 py-2 rounded-lg border border-default">
              Vei primi factura proforma cu datele de transfer dupa confirmare
            </p>
          )}

          {error && (
            <div className="flex items-center gap-2 text-danger text-sm mb-3.5 bg-danger/5 px-3 py-2.5 rounded-lg border border-danger/20">
              <Warning size={15} />
              {error}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={placing || addresses.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-2 mb-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
            {placing
              ? <><CircleNotch size={16} className="animate-spin" /> Se proceseaza...</>
              : paymentMethod === 'card'
                ? <><ArrowRight size={15} /> Continua la plata</>
                : <><Check size={15} /> Plaseaza comanda</>}
          </button>

          <button
            onClick={() => navigate('/cart')}
            className="btn-outline w-full">
            Inapoi la cos
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────

// Sectiune cu titlu si icona folosita pentru gruparea formularului de checkout
function Section({ icon, title, children }) {
  return (
    <div className="bg-surface border border-default rounded-2xl p-6 mb-4">
      <h3 className="font-display font-bold text-primary text-lg mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  )
}

function Badge({ text, color }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold border ${
      color === 'accent'
        ? 'bg-accent-dim text-accent border-accent-border'
        : 'bg-base-2 text-secondary border-default'
    }`}>
      {text}
    </span>
  )
}
