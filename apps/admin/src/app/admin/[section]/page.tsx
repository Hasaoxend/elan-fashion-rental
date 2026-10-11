import { Wrench, CreditCard, BarChart3, Settings, Shirt, Plus } from 'lucide-react';

const pages: Record<string, { title: string; description: string; icon: any }> = {
  maintenance: { title: 'Bảo trì', description: 'Lập lịch bảo trì, giặt và theo dõi chi phí theo sản phẩm.', icon: Wrench },
  payments: { title: 'Thanh toán', description: 'Theo dõi giao dịch, tiền cọc, hoàn tiền và trạng thái thanh toán.', icon: CreditCard },
  reports: { title: 'Báo cáo', description: 'Phân tích doanh thu, hiệu suất sản phẩm và tỷ lệ sử dụng.', icon: BarChart3 },
  settings: { title: 'Cấu hình', description: 'Cài đặt cửa hàng, chính sách thuê và quyền truy cập.', icon: Settings },
};

export default async function PlaceholderPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const page = pages[section] || pages.settings;
  const Icon = page.icon;
  return <div className="max-w-3xl mx-auto py-16 text-center"><div className="w-16 h-16 rounded-2xl bg-[#F5EDE3] flex items-center justify-center mx-auto mb-6"><Icon className="w-8 h-8 text-[#C89B6D]" /></div><h1 className="text-3xl font-semibold mb-3">{page.title}</h1><p className="text-[#6B6B6B] mb-8">{page.description}</p><div className="bg-white border border-[#E5E3DF] rounded-2xl p-8 text-left"><h2 className="font-semibold mb-2">Module đang được mở rộng</h2><p className="text-sm text-[#6B6B6B] leading-relaxed">Dữ liệu nền tảng và API đã sẵn sàng. Các thao tác trong module này sẽ được kết nối với schema Prisma, audit log và realtime event theo cùng kiến trúc của đơn hàng.</p></div></div>;
}