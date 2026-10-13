'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Package, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { createProduct, getCategories, getProduct, updateProduct } from '@/lib/api';
import { PRODUCT_STATUS_LABELS } from '@/lib/labels';
import { EditorTabs } from '@/components/editor-tabs';
import { useToast } from '@/components/toast';

interface ProductFormState {
  sku: string; name: string; slug: string; description: string; shortDescription: string; categoryId: string;
  pricePerDay: number; price3Days: number; price7Days: number; depositAmount: number; serviceFeeRate: number;
  brand: string; material: string; colorName: string; sizeLabel: string; status: string; isActive: boolean; isFeatured: boolean;
  images: Array<{ url: string; altText: string }>;
  variants: Array<{ size: string; color: string; stockTotal: number }>;
}

const emptyForm: ProductFormState = {
  sku: '', name: '', slug: '', description: '', shortDescription: '', categoryId: '',
  pricePerDay: 500000, price3Days: 1200000, price7Days: 2400000, depositAmount: 1000000, serviceFeeRate: 0.05,
  brand: '', material: '', colorName: '', sizeLabel: '', status: 'available', isActive: true, isFeatured: false,
  images: [{ url: '', altText: '' }],
  variants: [{ size: 'S', color: 'default', stockTotal: 0 }, { size: 'M', color: 'default', stockTotal: 0 }, { size: 'L', color: 'default', stockTotal: 0 }],
};

// Trạng thái hiển thị bên web khách (apps/web/src/app/products/[id]/page.tsx).
const WEB_STATUS_LABELS: Record<string, string> = { available: 'Có sẵn', reserved: 'Đang được đặt', rented: 'Đã thuê', maintenance: 'Đang bảo trì' };

const currency = (value: number) => value.toLocaleString('vi-VN') + 'đ';
const slugify = (value: string) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const isUrl = (value: string) => { try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; } };
const inputClass = 'mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]';

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(Boolean(productId));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getCategories(), productId ? getProduct(productId) : Promise.resolve(null)])
      .then(([categoryList, product]) => {
        setCategories(categoryList);
        if (!product) { setForm((current) => ({ ...current, categoryId: categoryList[0]?.id ?? '' })); return; }
        setForm({
          sku: product.sku, name: product.name, slug: product.slug, description: product.description,
          shortDescription: product.shortDescription ?? '', categoryId: product.categoryId,
          pricePerDay: product.pricePerDay, price3Days: product.price3Days, price7Days: product.price7Days,
          depositAmount: product.depositAmount, serviceFeeRate: product.serviceFeeRate,
          brand: product.brand ?? '', material: product.material ?? '', colorName: product.colorName ?? '', sizeLabel: product.sizeLabel ?? '',
          status: product.status, isActive: product.isActive, isFeatured: product.isFeatured,
          images: product.images.length ? product.images.map((image: any) => ({ url: image.url, altText: image.altText ?? '' })) : [{ url: '', altText: '' }],
          variants: product.variants.map((v: any) => ({ size: v.size, color: v.color, stockTotal: v.stockTotal })),
        });
      })
      .catch((e) => toast('error', e instanceof Error ? e.message : 'Không thể tải trang phục.'))
      .finally(() => setLoading(false));
  }, [productId, toast]);

  const set = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => setForm((current) => ({ ...current, [key]: value }));
  const setName = (name: string) => setForm((current) => ({ ...current, name, ...(slugTouched ? {} : { slug: slugify(name) }) }));
  const setImage = (index: number, patch: Partial<ProductFormState['images'][number]>) => set('images', form.images.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const setVariant = (index: number, patch: Partial<ProductFormState['variants'][number]>) => set('variants', form.variants.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const images = form.images.filter((image) => image.url !== '');
  const validImages = images.filter((image) => isUrl(image.url));
  const sizes = Array.from(new Set(form.variants.map((v) => v.size).filter(Boolean)));
  const stock = form.variants.reduce((sum, v) => sum + v.stockTotal, 0);

  const validate = () => {
    if (form.name.trim().length < 2) return 'Tên sản phẩm tối thiểu 2 ký tự.';
    if (form.sku.trim().length < 2) return 'SKU tối thiểu 2 ký tự.';
    if (form.slug.trim().length < 2) return 'Slug tối thiểu 2 ký tự.';
    if (!form.categoryId) return 'Vui lòng chọn danh mục.';
    if (form.description.trim().length < 10) return 'Mô tả tối thiểu 10 ký tự.';
    if ([form.pricePerDay, form.price3Days, form.price7Days].some((price) => price < 1000)) return 'Giá thuê tối thiểu 1.000đ.';
    if (images.length !== validImages.length) return 'Có URL ảnh không hợp lệ (cần bắt đầu bằng http:// hoặc https://).';
    if (form.variants.some((v) => !v.size.trim() || !v.color.trim())) return 'Biến thể cần có đủ size và màu.';
    return '';
  };

  const submit = async () => {
    const error = validate();
    if (error) { toast('error', error); return; }
    setSaving(true);
    try {
      const payload = { ...form, images: images.map((image, index) => ({ url: image.url.trim(), altText: image.altText || form.name, sortOrder: index })) };
      if (productId) await updateProduct(productId, payload);
      else await createProduct(payload);
      toast('success', productId ? 'Cập nhật trang phục thành công.' : 'Tạo trang phục thành công.');
      router.push('/admin/products');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Không thể lưu trang phục.');
    } finally { setSaving(false); }
  };

  const category = categories.find((c) => c.id === form.categoryId);

  const preview = (
    <div className="space-y-8">
      {(!form.isActive || form.status === 'inactive') && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FFF4DE] text-[#B8843F] text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          Trang phục đang ở trạng thái ẩn/ngừng kinh doanh — khách hàng sẽ không thấy trang này trên website.
        </div>
      )}
      <div>
        <p className="text-xs uppercase tracking-widest text-[#A0A0A0] mb-4">Trang chi tiết trên website</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#F8F7F5] mb-4">
              {validImages[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={validImages[0].url} alt={validImages[0].altText || form.name} className="w-full h-full object-cover" />
              ) : <div className="absolute inset-0 flex flex-col items-center justify-center text-sm text-[#A0A0A0]"><Package className="w-8 h-8 mb-2" />Chưa có ảnh</div>}
            </div>
            {validImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {validImages.map((image, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={index} src={image.url} alt={image.altText || form.name} className={`aspect-square rounded-lg object-cover border-2 ${index === 0 ? 'border-[#C89B6D]' : 'border-transparent opacity-70'}`} />
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#E8F5EE] text-[#3D8B5F]">{WEB_STATUS_LABELS[form.status] || 'Có sẵn'}</span>
              <span className="text-xs text-[#A0A0A0]">SKU: {form.sku || '—'}</span>
            </div>
            <h1 className="font-serif text-4xl mb-4">{form.name || <span className="text-[#A0A0A0]">Tên trang phục</span>}</h1>
            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-3xl font-bold">{currency(form.pricePerDay)}</span>
              <span className="text-sm text-[#6B6B6B]">/ ngày</span>
            </div>
            <p className="text-[#6B6B6B] leading-relaxed mb-8 whitespace-pre-line">{form.description || <span className="italic text-[#A0A0A0]">Chưa có mô tả.</span>}</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 py-6 border-y border-[#E5E3DF] text-sm">
              <div><dt className="text-[#A0A0A0] mb-1">Kích thước</dt><dd className="font-medium">{sizes.join(' / ') || '—'}</dd></div>
              <div><dt className="text-[#A0A0A0] mb-1">Màu sắc</dt><dd className="font-medium">{form.colorName || '—'}</dd></div>
              <div><dt className="text-[#A0A0A0] mb-1">Chất liệu</dt><dd className="font-medium">{form.material || '—'}</dd></div>
              <div><dt className="text-[#A0A0A0] mb-1">Thương hiệu</dt><dd className="font-medium">{form.brand || '—'}</dd></div>
              <div><dt className="text-[#A0A0A0] mb-1">Tồn kho</dt><dd className="font-medium">{stock} sản phẩm</dd></div>
              <div><dt className="text-[#A0A0A0] mb-1">Tiền cọc</dt><dd className="font-medium">{currency(form.depositAmount)}</dd></div>
            </dl>
          </div>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-[#A0A0A0] mb-4">Thẻ sản phẩm trong danh sách{form.isFeatured ? ' · hiển thị ở mục Nổi bật' : ''}</p>
        <article className="w-64 bg-white rounded-2xl overflow-hidden border border-[#E5E3DF]">
          <div className="relative aspect-[3/4] bg-[#F8F7F5]">
            {validImages[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={validImages[0].url} alt={form.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="p-5">
            <span className="text-xs text-[#A0A0A0]">{form.sku}</span>
            <h3 className="font-semibold mt-2 mb-2 line-clamp-1">{form.name || 'Tên trang phục'}</h3>
            <p className="text-xs text-[#A0A0A0] mb-4">{category?.name}</p>
            <div className="text-lg font-bold">{currency(form.pricePerDay)}<span className="text-xs font-normal text-[#6B6B6B]"> / ngày</span></div>
            <div className="text-xs text-[#A0A0A0] mt-1">3 ngày: {currency(form.price3Days)}</div>
          </div>
        </article>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#171717]"><ArrowLeft className="w-4 h-4" /> Quay lại danh sách</Link>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{productId ? 'Chỉnh sửa trang phục' : 'Thêm trang phục'}</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Chuyển sang tab “Xem trước” để xem thông tin hiển thị với khách hàng.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/products" className="px-5 py-3 bg-white border border-[#E5E3DF] rounded-lg text-sm">Hủy</Link>
          <button onClick={submit} disabled={saving || loading} className="inline-flex items-center gap-2 px-5 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] disabled:opacity-40">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}{productId ? 'Lưu thay đổi' : 'Tạo trang phục'}
          </button>
        </div>
      </div>

      {loading ? <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C89B6D]" /></div> : (
        <EditorTabs preview={preview}>
          <div className="space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm">Tên sản phẩm *<input value={form.name} onChange={(e) => setName(e.target.value)} className={inputClass} /></label>
              <label className="block text-sm">Mã SKU *<input value={form.sku} onChange={(e) => set('sku', e.target.value)} className={inputClass} /></label>
              <label className="block text-sm">Đường dẫn (slug) *<input value={form.slug} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value); }} className={inputClass} /></label>
              <label className="block text-sm">Danh mục *
                <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} className={inputClass}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="block text-sm md:col-span-2">Mô tả *
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={6} className={inputClass} />
                <span className="text-xs text-[#A0A0A0]">Tối thiểu 10 ký tự. Xuống dòng sẽ được giữ nguyên khi hiển thị.</span>
              </label>
              <label className="block text-sm md:col-span-2">Mô tả ngắn<input value={form.shortDescription} onChange={(e) => set('shortDescription', e.target.value)} className={inputClass} /></label>
              <label className="block text-sm">Thương hiệu<input value={form.brand} onChange={(e) => set('brand', e.target.value)} className={inputClass} /></label>
              <label className="block text-sm">Chất liệu<input value={form.material} onChange={(e) => set('material', e.target.value)} className={inputClass} /></label>
              <label className="block text-sm">Màu sắc<input value={form.colorName} onChange={(e) => set('colorName', e.target.value)} className={inputClass} /></label>
              <label className="block text-sm">Nhãn kích thước<input value={form.sizeLabel} onChange={(e) => set('sizeLabel', e.target.value)} placeholder="Ví dụ: S / M / L" className={inputClass} /></label>
            </section>

            <section>
              <h3 className="font-medium mb-4">Giá & trạng thái</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block text-sm">Giá thuê/ngày (VND) *<input type="number" min={1000} value={form.pricePerDay} onChange={(e) => set('pricePerDay', Number(e.target.value))} className={inputClass} /></label>
                <label className="block text-sm">Giá thuê 3 ngày (VND) *<input type="number" min={1000} value={form.price3Days} onChange={(e) => set('price3Days', Number(e.target.value))} className={inputClass} /></label>
                <label className="block text-sm">Giá thuê 7 ngày (VND) *<input type="number" min={1000} value={form.price7Days} onChange={(e) => set('price7Days', Number(e.target.value))} className={inputClass} /></label>
                <label className="block text-sm">Tiền cọc (VND)<input type="number" min={0} value={form.depositAmount} onChange={(e) => set('depositAmount', Number(e.target.value))} className={inputClass} /></label>
                <label className="block text-sm">Phí dịch vụ (%)<input type="number" min={0} max={100} step="0.5" value={Math.round(form.serviceFeeRate * 10000) / 100} onChange={(e) => set('serviceFeeRate', Number(e.target.value) / 100)} className={inputClass} /></label>
                <label className="block text-sm">Trạng thái
                  <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                    {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="w-4 h-4 accent-[#C89B6D]" /><span className="text-sm">Hiển thị trên website</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="w-4 h-4 accent-[#C89B6D]" /><span className="text-sm">Nổi bật</span></label>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium">Hình ảnh sản phẩm</h3>
                  <p className="text-xs text-[#A0A0A0] mt-1">Dán URL ảnh HTTPS. Ảnh đầu tiên là ảnh đại diện.</p>
                </div>
                <button type="button" onClick={() => set('images', [...form.images, { url: '', altText: '' }])} className="inline-flex items-center gap-1 text-sm px-4 py-2 bg-[#F8F7F5] rounded-lg hover:bg-[#ECECEC]"><Plus className="w-4 h-4" /> Thêm ảnh</button>
              </div>
              <div className="space-y-3">
                {form.images.map((image, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 p-4 bg-[#FAF9F8] rounded-xl">
                    <input value={image.url} onChange={(e) => setImage(index, { url: e.target.value })} placeholder="https://..." aria-label={`URL ảnh ${index + 1}`} className={`px-3 py-2 border rounded-lg text-sm outline-none focus:border-[#C89B6D] ${image.url && !isUrl(image.url) ? 'border-[#C94A4A]' : 'border-[#E5E3DF]'}`} />
                    <input value={image.altText} onChange={(e) => setImage(index, { altText: e.target.value })} placeholder="Mô tả ảnh" aria-label={`Mô tả ảnh ${index + 1}`} className="px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm outline-none focus:border-[#C89B6D]" />
                    <button type="button" onClick={() => set('images', form.images.filter((_, i) => i !== index))} className="inline-flex items-center justify-center gap-1 text-xs px-3 py-2 bg-[#FDECEC] text-[#C94A4A] rounded-lg"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="font-medium">Biến thể (Size / Màu / Tồn kho)</h3>
              <p className="text-xs text-[#A0A0A0] mt-1 mb-4">Không thể xóa biến thể đã có đơn thuê.</p>
              <div className="space-y-3">
                <div className="hidden md:grid grid-cols-4 gap-3 px-4 text-xs text-[#A0A0A0]"><span>Size</span><span>Màu</span><span>Tồn kho</span><span /></div>
                {form.variants.map((v, i) => (
                  <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-[#FAF9F8] rounded-xl">
                    <input value={v.size} onChange={(e) => setVariant(i, { size: e.target.value })} placeholder="Size" aria-label="Size" className="px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm outline-none focus:border-[#C89B6D]" />
                    <input value={v.color} onChange={(e) => setVariant(i, { color: e.target.value })} placeholder="Màu" aria-label="Màu" className="px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm outline-none focus:border-[#C89B6D]" />
                    <input type="number" min={0} value={v.stockTotal} onChange={(e) => setVariant(i, { stockTotal: Number(e.target.value) })} placeholder="Tồn kho" aria-label="Tồn kho" className="px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm outline-none focus:border-[#C89B6D]" />
                    <button type="button" onClick={() => set('variants', form.variants.filter((_, idx) => idx !== i))} className="inline-flex items-center justify-center gap-1 text-xs px-3 py-2 bg-[#FDECEC] text-[#C94A4A] rounded-lg"><Trash2 className="w-3.5 h-3.5" /> Xóa</button>
                  </div>
                ))}
                <button type="button" onClick={() => set('variants', [...form.variants, { size: '', color: 'default', stockTotal: 0 }])} className="inline-flex items-center gap-1 text-sm px-4 py-2 bg-[#F8F7F5] rounded-lg hover:bg-[#ECECEC]"><Plus className="w-4 h-4" /> Thêm biến thể</button>
              </div>
            </section>
          </div>
        </EditorTabs>
      )}
    </div>
  );
}
