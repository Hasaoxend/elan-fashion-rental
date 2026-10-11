'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Search, Loader2, MoreHorizontal, Package, Pencil, Trash2, Eye } from 'lucide-react';
import { getAdminProducts, createProduct, updateProduct, deleteProduct, getCategories } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { useToast } from '@/components/toast';

const currency = (value: number) => value.toLocaleString('vi-VN') + 'đ';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [productList, categoryList] = await Promise.all([getAdminProducts(), getCategories()]);
      setProducts(productList.items);
      setCategories(categoryList);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Không thể tải sản phẩm.');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditing(null);
    setForm({
      sku: '', name: '', slug: '', description: '', shortDescription: '',
      categoryId: categories[0]?.id || '', pricePerDay: 500000, price3Days: 1200000, price7Days: 2400000,
      depositAmount: 1000000, serviceFeeRate: 0.05, brand: '', material: '', colorName: '', sizeLabel: '',
      status: 'available', isActive: true, isFeatured: false,
      images: [{ url: '', altText: '', sortOrder: 0 }],
      variants: [{ size: 'S', color: 'default', stockTotal: 0 }, { size: 'M', color: 'default', stockTotal: 0 }, { size: 'L', color: 'default', stockTotal: 0 }],
    });
    setShowForm(true);
  };

  const openEdit = (product: any) => {
    setEditing(product);
    setForm({
      ...product,
      pricePerDay: Number(product.pricePerDay),
      price3Days: Number(product.price3Days),
      price7Days: Number(product.price7Days),
      depositAmount: Number(product.depositAmount),
      serviceFeeRate: Number(product.serviceFeeRate),
      variants: product.variants?.map((v: any) => ({ ...v, stockTotal: Number(v.stockTotal) })) || [],
      images: product.images?.length ? product.images : [{ url: '', altText: '', sortOrder: 0 }],
    });
    setShowForm(true);
  };

  const submit = async () => {
    if (!form.name || !form.sku || !form.slug || !form.description || !form.categoryId) {
      toast('error', 'Vui lòng nhập đầy đủ thông tin bắt buộc.');
      return;
    }
    try {
      const payload = {
        ...form,
        images: (form.images || [])
          .filter((image: any) => typeof image.url === 'string' && image.url.trim().length > 0)
          .map((image: any, index: number) => ({ url: image.url.trim(), altText: image.altText || form.name, sortOrder: index })),
      };
      if (editing) {
        await updateProduct(editing.id, payload);
        toast('success', 'Cập nhật sản phẩm thành công.');
      } else {
        await createProduct(payload);
        toast('success', 'Tạo sản phẩm thành công.');
      }
      setShowForm(false);
      load();
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể lưu sản phẩm.'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    try {
      await deleteProduct(id);
      toast('success', 'Xóa sản phẩm thành công.');
      load();
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể xóa sản phẩm.'); }
  };

  const updateVariantStock = (index: number, field: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      variants: prev.variants.map((v: any, i: number) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Quản lý trang phục</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Quản lý catalog và tình trạng sản phẩm.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-3 bg-white border border-[#E5E3DF] rounded-lg"><Loader2 className="w-4 h-4" /></button>
          <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] transition"><Plus className="w-4 h-4" /> Thêm trang phục</button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6 space-y-6">
          <h2 className="font-semibold">{editing ? 'Cập nhật trang phục' : 'Trang phục mới'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm">Tên sản phẩm *
              <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">SKU *
              <input value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Slug *
              <input value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Danh mục *
              <select value={form.categoryId || ''} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block text-sm md:col-span-2">Mô tả *
              <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Mô tả ngắn
              <input value={form.shortDescription || ''} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Thương hiệu
              <input value={form.brand || ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Chất liệu
              <input value={form.material || ''} onChange={(e) => setForm({ ...form, material: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Màu sắc
              <input value={form.colorName || ''} onChange={(e) => setForm({ ...form, colorName: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Size label
              <input value={form.sizeLabel || ''} onChange={(e) => setForm({ ...form, sizeLabel: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Giá thuê/ngày (VND)
              <input type="number" value={form.pricePerDay || 0} onChange={(e) => setForm({ ...form, pricePerDay: Number(e.target.value) })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Giá thuê 3 ngày (VND)
              <input type="number" value={form.price3Days || 0} onChange={(e) => setForm({ ...form, price3Days: Number(e.target.value) })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Giá thuê 7 ngày (VND)
              <input type="number" value={form.price7Days || 0} onChange={(e) => setForm({ ...form, price7Days: Number(e.target.value) })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Tiền cọc (VND)
              <input type="number" value={form.depositAmount || 0} onChange={(e) => setForm({ ...form, depositAmount: Number(e.target.value) })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Phí dịch vụ (%)
              <input type="number" step="0.01" value={form.serviceFeeRate || 0} onChange={(e) => setForm({ ...form, serviceFeeRate: Number(e.target.value) })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]" />
            </label>
            <label className="block text-sm">Trạng thái
              <select value={form.status || 'available'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-2 w-full px-4 py-3 border border-[#E5E3DF] rounded-lg outline-none focus:border-[#C89B6D]">
                <option value="available">Có sẵn</option>
                <option value="reserved">Đã giữ</option>
                <option value="rented">Đang thuê</option>
                <option value="maintenance">Bảo trì</option>
                <option value="inactive">Ngừng kinh doanh</option>
              </select>
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">Đang hoạt động</span>
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={form.isFeatured ?? false} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4" />
              <span className="text-sm">Nổi bật</span>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Hình ảnh sản phẩm</h3>
                <p className="text-xs text-[#A0A0A0] mt-1">Dán URL ảnh HTTPS (Unsplash, Cloudinary, S3...).</p>
              </div>
              <button onClick={() => setForm((prev: any) => ({ ...prev, images: [...(prev.images || []), { url: '', altText: '', sortOrder: (prev.images || []).length }] }))} className="text-sm px-4 py-2 bg-[#F8F7F5] rounded-lg hover:bg-[#ECECEC]">+ Thêm ảnh</button>
            </div>
            <div className="space-y-3">
              {(form.images || []).map((image: any, index: number) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 p-4 bg-[#FAF9F8] rounded-xl">
                  <input value={image.url} onChange={(e) => setForm((prev: any) => ({ ...prev, images: prev.images.map((item: any, i: number) => i === index ? { ...item, url: e.target.value } : item) }))} placeholder="https://..." className="px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm outline-none focus:border-[#C89B6D]" />
                  <input value={image.altText || ''} onChange={(e) => setForm((prev: any) => ({ ...prev, images: prev.images.map((item: any, i: number) => i === index ? { ...item, altText: e.target.value } : item) }))} placeholder="Mô tả ảnh" className="px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm outline-none focus:border-[#C89B6D]" />
                  <button onClick={() => setForm((prev: any) => ({ ...prev, images: prev.images.filter((_: any, i: number) => i !== index) }))} className="text-xs px-3 py-2 bg-[#FDECEC] text-[#C94A4A] rounded-lg">Xóa</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-4">Biến thể (Size / Màu / Tồn kho)</h3>
            <div className="space-y-3">
              {(form.variants || []).map((v: any, i: number) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-[#FAF9F8] rounded-xl">
                  <input value={v.size} onChange={(e) => updateVariantStock(i, 'size', e.target.value)} placeholder="Size" className="px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm outline-none" />
                  <input value={v.color} onChange={(e) => updateVariantStock(i, 'color', e.target.value)} placeholder="Màu" className="px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm outline-none" />
                  <input type="number" value={v.stockTotal} onChange={(e) => updateVariantStock(i, 'stockTotal', Number(e.target.value))} placeholder="Tồn kho" className="px-3 py-2 border border-[#E5E3DF] rounded-lg text-sm outline-none" />
                  <button onClick={() => setForm((prev: any) => ({ ...prev, variants: prev.variants.filter((_: any, idx: number) => idx !== i) }))} className="text-xs px-3 py-2 bg-[#FDECEC] text-[#C94A4A] rounded-lg">Xóa</button>
                </div>
              ))}
              <button onClick={() => setForm((prev: any) => ({ ...prev, variants: [...(prev.variants || []), { size: 'M', color: 'default', stockTotal: 0 }] }))} className="text-sm px-4 py-2 bg-[#F8F7F5] rounded-lg hover:bg-[#ECECEC]">+ Thêm biến thể</button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={submit} className="px-5 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D]">Lưu</button>
            <button onClick={() => setShowForm(false)} className="px-5 py-3 bg-white border border-[#E5E3DF] rounded-lg text-sm">Hủy</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#E5E3DF] rounded-2xl p-4 flex items-center gap-3">
        <Search className="w-4 h-4 text-[#A0A0A0]" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc mã sản phẩm..." className="flex-1 bg-transparent outline-none text-sm" />
      </div>

      <div className="bg-white border border-[#E5E3DF] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C89B6D]" /></div>
          ) : filtered.length ? (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-[#A0A0A0] bg-[#FAF9F8]">
                <tr>
                  <th className="px-6 py-4 font-medium">Sản phẩm</th>
                  <th className="px-6 py-4 font-medium">Danh mục</th>
                  <th className="px-6 py-4 font-medium">Giá thuê/ngày</th>
                  <th className="px-6 py-4 font-medium">Tồn kho</th>
                  <th className="px-6 py-4 font-medium">Trạng thái</th>
                  <th className="px-6 py-4 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F2F0]">
                {filtered.map((product) => {
                  const stock = product.availableStock ?? product.variants?.reduce((s: number, v: any) => s + v.stockTotal, 0) ?? 0;
                  return (
                    <tr key={product.id} className="hover:bg-[#FAF9F8]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-[#F8F7F5]">
                            {product.images?.[0]?.url ? (
                              <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="48px" />
                            ) : (
                              <Package className="w-5 h-5 absolute inset-0 m-auto text-[#A0A0A0]" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-[#A0A0A0]">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#6B6B6B]">{product.category?.name || '—'}</td>
                      <td className="px-6 py-4">{currency(product.pricePerDay)}</td>
                      <td className="px-6 py-4">{stock}</td>
                      <td className="px-6 py-4"><StatusBadge status={product.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/products/${product.id}`} className="p-2 text-[#6B6B6B] hover:text-[#171717]"><Eye className="w-4 h-4" /></Link>
                          <button onClick={() => openEdit(product)} className="p-2 text-[#6B6B6B] hover:text-[#171717]"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => remove(product.id)} className="p-2 text-[#C94A4A] hover:text-[#A03030]"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-sm text-[#A0A0A0]">Chưa có sản phẩm nào.</div>
          )}
        </div>
      </div>
    </div>
  );
}
