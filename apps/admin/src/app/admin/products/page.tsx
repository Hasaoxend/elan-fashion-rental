'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Loader2, Package, Pencil, Trash2, ExternalLink, RefreshCw, EyeOff } from 'lucide-react';
import { getAdminProducts, deleteProduct } from '@/lib/api';
import { StatusBadge } from '@/components/status-badge';
import { useToast } from '@/components/toast';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
const currency = (value: number) => value.toLocaleString('vi-VN') + 'đ';

function ProductsContent() {
  const params = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { setSearch(params.get('search') ?? ''); }, [params]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts((await getAdminProducts()).items);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Không thể tải sản phẩm.');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const keyword = search.toLowerCase();
  const filtered = products.filter((p) => !search || p.name.toLowerCase().includes(keyword) || p.sku.toLowerCase().includes(keyword));

  const remove = async (product: any) => {
    if (!confirm(`Xóa trang phục "${product.name}"? Thao tác này không thể hoàn tác.`)) return;
    try {
      await deleteProduct(product.id);
      toast('success', 'Xóa sản phẩm thành công.');
      load();
    } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể xóa sản phẩm.'); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Quản lý trang phục</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Quản lý catalog và tình trạng sản phẩm.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} title="Làm mới" aria-label="Làm mới" className="p-3 bg-white border border-[#E5E3DF] rounded-lg hover:border-[#171717]"><RefreshCw className="w-4 h-4" /></button>
          <Link href="/admin/products/new" className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#171717] text-white rounded-lg text-sm hover:bg-[#C89B6D] transition"><Plus className="w-4 h-4" /> Thêm trang phục</Link>
        </div>
      </div>

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
                  <th className="px-6 py-4 font-medium">Tồn khả dụng</th>
                  <th className="px-6 py-4 font-medium">Trạng thái</th>
                  <th className="px-6 py-4 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F2F0]">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FAF9F8]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-[#F8F7F5] shrink-0">
                          {product.images[0] ? (
                            <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="48px" />
                          ) : (
                            <Package className="w-5 h-5 absolute inset-0 m-auto text-[#A0A0A0]" />
                          )}
                        </div>
                        <div>
                          <Link href={`/admin/products/${product.id}/edit`} className="font-medium hover:text-[#C89B6D]">{product.name}</Link>
                          <p className="text-xs text-[#A0A0A0]">{product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#6B6B6B]">{product.category.name}</td>
                    <td className="px-6 py-4">{currency(product.pricePerDay)}</td>
                    <td className="px-6 py-4">{product.availableStock}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={product.status} />
                        {!product.isActive && <span className="inline-flex items-center gap-1 text-xs text-[#A0A0A0]"><EyeOff className="w-3.5 h-3.5" /> Đang ẩn</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <a href={`${WEB_URL}/products/${product.id}`} target="_blank" rel="noreferrer" title="Xem trên website" aria-label="Xem trên website" className="p-2 text-[#6B6B6B] hover:text-[#171717]"><ExternalLink className="w-4 h-4" /></a>
                        <Link href={`/admin/products/${product.id}/edit`} title="Chỉnh sửa" aria-label="Chỉnh sửa" className="p-2 text-[#6B6B6B] hover:text-[#171717]"><Pencil className="w-4 h-4" /></Link>
                        <button onClick={() => remove(product)} title="Xóa" aria-label="Xóa" className="p-2 text-[#C94A4A] hover:text-[#A03030]"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center text-sm text-[#A0A0A0]">{search ? 'Không tìm thấy trang phục phù hợp.' : 'Chưa có sản phẩm nào.'}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() { return <Suspense><ProductsContent /></Suspense>; }
