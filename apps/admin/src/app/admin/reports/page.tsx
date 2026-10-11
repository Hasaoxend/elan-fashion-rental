'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, BarChart3, TrendingUp, Users, Wrench, Calendar } from 'lucide-react';
import { getReports } from '@/lib/api';
import { useToast } from '@/components/toast';

const currency = (value: number) => value.toLocaleString('vi-VN') + 'đ';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getReports(days)); } catch (e) { toast('error', e instanceof Error ? e.message : 'Không thể tải báo cáo.'); }
    finally { setLoading(false); }
  }, [days, toast]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = Object.values(data?.revenueByDay ?? {}).reduce((s: number, v: any) => s + Number(v), 0);
  const maxRevenue = Math.max(0, ...Object.values(data?.revenueByDay ?? {}).map(Number));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Báo cáo</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Phân tích doanh thu, hiệu suất sản phẩm và khách hàng.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="px-4 py-2 border border-[#E5E3DF] rounded-lg text-sm outline-none focus:border-[#C89B6D]">
            <option value={7}>7 ngày</option>
            <option value={30}>30 ngày</option>
            <option value={60}>60 ngày</option>
            <option value={90}>90 ngày</option>
          </select>
          <button onClick={load} className="p-3 bg-white border border-[#E5E3DF] rounded-lg"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C89B6D]" /></div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm text-[#6B6B6B]">Tổng doanh thu</p>
                <div className="w-10 h-10 rounded-xl bg-[#E8F5EE] flex items-center justify-center"><TrendingUp className="w-5 h-5 text-[#3D8B5F]" /></div>
              </div>
              <p className="text-2xl font-semibold">{currency(totalRevenue)}</p>
            </div>
            <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm text-[#6B6B6B]">Số lượt thuê</p>
                <div className="w-10 h-10 rounded-xl bg-[#F5EDE3] flex items-center justify-center"><BarChart3 className="w-5 h-5 text-[#C89B6D]" /></div>
              </div>
              <p className="text-2xl font-semibold">{data.utilization}</p>
            </div>
            <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm text-[#6B6B6B]">Chi phí bảo trì</p>
                <div className="w-10 h-10 rounded-xl bg-[#FFF4DE] flex items-center justify-center"><Wrench className="w-5 h-5 text-[#D99A32]" /></div>
              </div>
              <p className="text-2xl font-semibold">{currency(data.maintenanceCost)}</p>
            </div>
            <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm text-[#6B6B6B]">Trạng thái đơn hàng</p>
                <div className="w-10 h-10 rounded-xl bg-[#ECECEC] flex items-center justify-center"><Calendar className="w-5 h-5 text-[#171717]" /></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.statusCounts.map((s: any) => (
                  <span key={s.status} className="text-xs px-2 py-1 bg-[#F8F7F5] rounded-full">{s.status}: {s._count._all}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5E3DF] rounded-2xl p-6">
            <h2 className="font-semibold mb-6">Doanh thu theo ngày</h2>
            <div className="flex items-end gap-1 h-40">
              {Object.entries(data.revenueByDay).slice(-30).map(([date, value]: [string, any]) => (
                <div key={date} className="flex-1 flex flex-col items-center gap-2 group">
                  <div
                    className="w-full bg-[#C89B6D] rounded-t hover:bg-[#B88A5C] transition"
                    style={{ height: `${maxRevenue ? (Number(value) / maxRevenue) * 100 : 0}%`, minHeight: '4px' }}
                  />
                  <span className="text-[10px] text-[#A0A0A0] opacity-0 group-hover:opacity-100 transition">{date.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E5E3DF] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E5E3DF]">
                <h2 className="font-semibold">Top sản phẩm</h2>
              </div>
              <div className="divide-y divide-[#F3F2F0]">
                {data.topProducts.map((p: any, i: number) => (
                  <div key={p.productId} className="px-6 py-4 flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-[#F8F7F5] text-sm font-medium text-[#6B6B6B] flex items-center justify-center">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium">{p.product?.name || '—'}</p>
                      <p className="text-xs text-[#A0A0A0]">{p.product?.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{currency(p._sum.lineSubtotal ?? 0)}</p>
                      <p className="text-xs text-[#A0A0A0]">{p._count._all} lượt thuê</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E5E3DF] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E5E3DF]">
                <h2 className="font-semibold">Top khách hàng</h2>
              </div>
              <div className="divide-y divide-[#F3F2F0]">
                {data.topCustomers.map((c: any, i: number) => (
                  <div key={c.customerId} className="px-6 py-4 flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-[#F8F7F5] text-sm font-medium text-[#6B6B6B] flex items-center justify-center">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium">{c.customer?.fullName || '—'}</p>
                      <p className="text-xs text-[#A0A0A0]">{c.customer?.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{currency(c._sum.total ?? 0)}</p>
                      <p className="text-xs text-[#A0A0A0]">{c._count._all} đơn</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-16 text-center text-sm text-[#A0A0A0]">Không có dữ liệu báo cáo.</div>
      )}
    </div>
  );
}
