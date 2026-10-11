import Link from 'next/link';
import Image from 'next/image';
import { getCategories } from '@/lib/api';

export default async function CollectionsPage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  try { categories = await getCategories(); } catch { categories = []; }

  return (
    <div>
      <section className="bg-white border-b border-[#E5E3DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="text-sm tracking-[0.2em] uppercase text-[#C89B6D] mb-3">Bộ sưu tập</p>
          <h1 className="font-display text-5xl mb-4">Khám phá theo phong cách</h1>
          <p className="text-[#6B6B6B] max-w-xl">Từ váy dạ hội đến trang phục biểu diễn — mỗi bộ sưu tập là một câu chuyện.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Link key={category.id} href={`/products?category=${category.slug}`} className="group block">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#E9E5DF] mb-5">
                  <Image
                    src={category.imageUrl || `https://images.unsplash.com/photo-${['1496747611176-843222e1e57c', '1539109136881-3be0616acf4b', '1515372039744-b8f02a3ae446', '1483985988355-763728e1935b', '1595777457583-95e059d581b8', '1566174053879-31528523f8ae'][index % 6]}?auto=format&fit=crop&w=900&q=85`}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-1 group-hover:text-[#C89B6D] transition">{category.name}</h3>
                <p className="text-sm text-[#6B6B6B] mb-2">{category.description}</p>
                <p className="text-xs text-[#A0A0A0]">{category._count?.products || 0} thiết kế</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center bg-white rounded-2xl text-[#6B6B6B]">Không thể tải bộ sưu tập. Vui lòng thử lại sau.</div>
        )}
      </section>
    </div>
  );
}