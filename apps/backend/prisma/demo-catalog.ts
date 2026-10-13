// Dữ liệu catalog demo: ảnh (Unsplash, đã duyệt đúng chủ đề), tên, giá, chất liệu và size theo từng danh mục.
// Thứ tự danh mục khớp categorySeeds trong seed.ts; sản phẩm thứ i thuộc danh mục i % 8.
// Chỉ thêm vào CUỐI các mảng names/photos để sản phẩm cũ giữ nguyên tên.

export const PRODUCTS_PER_CATEGORY = 12;

export const photo = (id: string, width = 1000) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=85`;

interface DemoCategory {
  slug: string;
  cover: string;
  /** Giá thuê/ngày thấp nhất (VND) */
  basePrice: number;
  materials: string[];
  colors: string[];
  sizes: string[];
  names: string[];
  photos: string[];
}

export const demoCatalog: DemoCategory[] = [
  {
    slug: 'vay-du-tiec',
    cover: '1595777457583-95e059d581b8',
    basePrice: 450000,
    materials: ['Lụa satin', 'Ren cao cấp', 'Nhung', 'Voan kim sa'],
    colors: ['Đỏ ruby', 'Champagne', 'Đen', 'Xanh midnight', 'Hồng phấn'],
    sizes: ['S', 'M', 'L'],
    names: ['Váy Dạ Hội Aurora', 'Váy Lụa Champagne', 'Váy Đỏ Ruby Gala', 'Váy Velvet Midnight', 'Váy Rose Garden', 'Váy Golden Hour', 'Váy Emerald Grace', 'Váy Đầm Xòe Bordeaux', 'Váy Sequin Starlight', 'Váy Cúp Ngực Noir', 'Váy Xanh Sapphire', 'Váy Ánh Bạc Moonlight'],
    photos: ['1566174053879-31528523f8ae', '1595777457583-95e059d581b8', '1539008835657-9e8e9680c956', '1612336307429-8a898d10e223', '1572804013309-59a88b7e92f1', '1585487000160-6ebcfceb0d03', '1612722432474-b971cdcea546', '1515372039744-b8f02a3ae446', '1609505848912-b7c3b8b4beda', '1605763240000-7e93b172d754',
      '1568252542512-9fe8fe9c87bb', '1568251188392-ae32f898cb3b', '1623580674393-edf6eb7090f8', '1617258856138-402b60da4e2a', '1610048616025-11a3dcc9fd0b', '1583039949165-96ee24b0d8de', '1746025241709-0fb2528687e2', '1547697933-66bcb20f114a', '1763959952596-1512ebea8eb1', '1610209740880-6ecc4b20ea78', '1682183948920-16d882bd786d', '1775036190849-16ef6dc9519e'],
  },
  {
    slug: 'vay-cuoi',
    cover: '1594552072238-b8a33785b261',
    basePrice: 1200000,
    materials: ['Ren Pháp', 'Voan lụa', 'Satin cao cấp', 'Tulle đính đá'],
    colors: ['Trắng tinh khôi', 'Ivory', 'Kem champagne'],
    sizes: ['S', 'M', 'L'],
    names: ['Váy Cưới Pearl Muse', 'Váy Cưới Silk Serenity', 'Váy Cưới Ren Pháp', 'Váy Cưới Đuôi Cá Luna', 'Váy Cưới Công Chúa Blush', 'Váy Cưới Minimal Ivory', 'Váy Cưới Bohemian', 'Váy Cưới Biển Xanh', 'Váy Cưới Tay Ren Vintage', 'Váy Cưới Xòe Hoàng Gia', 'Váy Cưới Lưng Trần', 'Váy Cưới Voan Mây'],
    photos: ['1594552072238-b8a33785b261', '1595407753234-0882f1e77954', '1525258946800-98cfd641d0de', '1583939003579-730e3918a45a', '1550005809-91ad75fb315f', '1591604466107-ec97de577aff',
      '1599142296733-1c1f2073e6de', '1549488497-94b52bddac5d', '1622277430358-f4d134452e2e', '1532454781337-fc3edff34f91', '1579583764988-3e08c6132d2a', '1585241920473-b472eb9ffbae', '1492175742197-ed20dc5a6bed', '1549416878-b9ca95e26903', '1502955422409-06e43fd3eff3'],
  },
  {
    slug: 'ao-dai',
    cover: '1722111008436-d2901ba1237d',
    basePrice: 250000,
    materials: ['Lụa tơ tằm', 'Gấm', 'Lụa Hà Đông', 'Chiffon'],
    colors: ['Trắng', 'Đỏ', 'Hồng phấn', 'Xanh ngọc', 'Đen'],
    sizes: ['S', 'M', 'L', 'XL'],
    names: ['Áo Dài Ngọc Lan', 'Áo Dài Mộc Miên', 'Áo Dài Sen Hồng', 'Áo Dài Lụa Đỏ Tết', 'Áo Dài Trắng Tinh Khôi', 'Áo Dài Nam Gấm Lam', 'Áo Dài Gấm Hoa Xuân', 'Áo Dài Cách Tân Hồng Phấn', 'Áo Dài Hoa Nhí Hà Nội', 'Áo Dài Lụa Xanh Ngọc', 'Áo Dài Ngũ Thân Cổ Phục', 'Áo Dài Trắng Hoa Sen'],
    photos: ['1675389017197-9ae63c2b2fe8', '1609952917837-2394b5a4d2fb', '1621526839624-619d47817292', '1675388135186-4ab6fb74abbd', '1722111008436-d2901ba1237d', '1633058851668-8b5b96d09736', '1722111627062-57cd2cda63df', '1722111008496-8c8cdbd51d82', '1700721154874-78695c314eed', '1787588647858-1f8cac07462f', '1705049316557-60cf23c139ca', '1767603086492-adb1e588d089',
      '1615561077352-c6440eadf222', '1707741015015-e25a5796c20a', '1615561076978-3adb48b36e9e', '1707741015118-4060b50308ff', '1696276735314-88029e54148b', '1768452569883-cca8996a134b', '1768452571158-8764725a29ce', '1768452570667-e3f8c604d918', '1776762817538-5214734eaf06', '1768452570697-62c8b864dd3a', '1762704814827-f72155fefb0f', '1768452570883-94e5a145991f'],
  },
  {
    slug: 'vest',
    cover: '1594938298603-c8148c4dae35',
    basePrice: 350000,
    materials: ['Len Ý', 'Wool blend', 'Linen', 'Tweed'],
    colors: ['Đen', 'Xanh navy', 'Xám charcoal', 'Be'],
    sizes: ['M', 'L', 'XL'],
    names: ['Vest Milano Classic', 'Vest Midnight Blue', 'Vest Sandstone', 'Vest Tuxedo Đen', 'Vest Kẻ Caro Oxford', 'Vest Xám Charcoal', 'Vest Kẻ Sọc Pinstripe', 'Vest Xanh Navy Slim', 'Vest Xám Bạc Wedding', 'Vest Đen Business', 'Vest Ba Mảnh Gentleman', 'Tuxedo Nơ Đen Gala'],
    photos: ['1507679799987-c73779587ccf', '1594938298603-c8148c4dae35', '1593030761757-71fae45fa0e7', '1617137968427-85924c800a22', '1598808503746-f34c53b9323e', '1617127365659-c47fa864d8bc', '1592878904946-b3cd8ae243d0',
      '1618886614638-80e3c103d31a', '1480429370139-e0132c086e2a', '1617137984095-74e4e5e3613f', '1534030347209-467a5b0ad3e6', '1622497170185-5d668f816a56', '1623880840102-7df0a9f3545b', '1593030103066-0093718efeb9', '1617113930975-f9c7243ae527', '1631052066165-9720608b36da', '1522968439036-e6338d0ed84f'],
  },
  {
    slug: 'trang-phuc-su-kien',
    cover: '1584273143981-41c073dfe8f8',
    basePrice: 300000,
    materials: ['Tuýt-xi', 'Dạ', 'Da thuộc', 'Cotton cao cấp'],
    colors: ['Đen', 'Be camel', 'Đỏ', 'Trắng', 'Xám'],
    sizes: ['S', 'M', 'L'],
    names: ['Suit Nữ Power Black', 'Blazer Camel Smart', 'Áo Khoác Da Sự Kiện', 'Set Street Style Gala', 'Măng Tô Dạ Milan', 'Set Sọc Thời Thượng', 'Blazer Đỏ Statement', 'Blazer Xám Kẻ Ô', 'Suit Be Thanh Lịch', 'Blazer Trắng Công Sở', 'Set Vest Nữ Tối Giản', 'Áo Khoác Phong Cách Peaky'],
    photos: ['1584273143981-41c073dfe8f8', '1552374196-1ab2a1c593e8', '1487222477894-8943e31ef7b2', '1520975954732-35dd22299614', '1539109136881-3be0616acf4b', '1483985988355-763728e1935b', '1611601322175-ef8ec8c85f01', '1509631179647-0177331693ae',
      '1616065297556-f05bc00c9a3e', '1696451203186-6eb38b06fbbc', '1608234808654-2a8875faa7fd', '1779400201925-6c6048bee7e5', '1697663426683-530277eb4fbd', '1617421272636-e676a3db8ea7', '1779150182406-accea37308c8', '1566758456102-02bea9470947', '1762331974989-417a274b2c2b', '1762331973063-4257731689c0'],
  },
  {
    slug: 'cosplay',
    cover: '1578632767115-351597cf2477',
    basePrice: 280000,
    materials: ['Vải thun co giãn', 'Da PU', 'Polyester', 'Vải dạ'],
    colors: ['Đỏ', 'Đen', 'Xanh', 'Nhiều màu'],
    sizes: ['S', 'M', 'L'],
    names: ['Cosplay Chúa Tể Bóng Tối', 'Cosplay Lính Đánh Thuê Đỏ', 'Cosplay Anime Phi Công', 'Cosplay Hiệp Sĩ Bóng Đêm', 'Cosplay Anime Học Đường', 'Cosplay Siêu Anh Hùng', 'Cosplay Người Nhện', 'Cosplay Ca Sĩ Ảo Tóc Xanh', 'Cosplay Gã Hề Áo Đỏ', 'Cosplay Cướp Biển Caribe', 'Cosplay Công Chúa Băng Giá', 'Cosplay Anime Tóc Bạch Kim'],
    photos: ['1586861203927-800a5acdcc4d', '1608889175123-8ee362201f81', '1578632767115-351597cf2477', '1531259683007-016a7b628fc3',
      '1635805737707-575885ab0820', '1727409048076-182d2907a59e', '1501432377862-3d0432b87a14', '1717185891319-6bf096fba62f', '1618588064115-ee5dfbd55e68', '1568417847905-1ba5effadab1', '1581661701347-6e695689365b', '1605495984007-ccb84be932b1', '1735720519574-b8f3ae156532', '1638237413873-67797007aee1', '1727409059001-e7a3e40de86e', '1577210944661-d982e8dae6e5'],
  },
  {
    slug: 'trang-phuc-bieu-dien',
    cover: '1547153760-18fc86324498',
    basePrice: 320000,
    materials: ['Thun lạnh', 'Lụa', 'Kim sa', 'Voan'],
    colors: ['Trắng', 'Đỏ', 'Vàng', 'Đen', 'Nhiều màu'],
    sizes: ['S', 'M', 'L'],
    names: ['Váy Múa Ba Lê Swan', 'Trang Phục Múa Đương Đại', 'Váy Tutu Sân Khấu', 'Jumpsuit Biểu Diễn Vàng', 'Váy Múa Lụa Bay', 'Trang Phục Nhảy Hiện Đại', 'Trang Phục Múa Ấn Độ', 'Váy Flamenco Đen', 'Trang Phục Lễ Hội Sắc Màu', 'Váy Múa Lụa Vàng', 'Trang Phục Múa Cổ Truyền', 'Trang Phục Múa Bụng'],
    photos: ['1547153760-18fc86324498', '1508807526345-15e9b5f4eaff', '1535525153412-5a42439a210d', '1518834107812-67b0b7c58434', '1504609813442-a8924e83f76e', '1515886657613-9f3515b0c78f',
      '1626697166932-8150c73436f5', '1764014792668-bc484714744f', '1770413692756-0e6168a3fb2e', '1624234636182-6d61fe4cd140', '1789720708672-494337453d60', '1791307557127-1e00295b6b6a', '1773709167195-66312b6d6f65', '1767979350390-2382c72f2660', '1686350751212-34ab58f5de31', '1771736462659-786b163d291e'],
  },
  {
    slug: 'phu-kien',
    cover: '1599643478518-a784e5dc4c8f',
    basePrice: 120000,
    materials: ['Bạc 925', 'Mạ vàng 18K', 'Ngọc trai', 'Đá CZ'],
    colors: ['Vàng', 'Bạc', 'Vàng hồng'],
    sizes: ['Free'],
    names: ['Bông Tai Sapphire', 'Vòng Cổ Trăng Khuyết', 'Lắc Tay Vàng Hồng', 'Bông Tai Giọt Lệ Xanh', 'Cài Áo Hoa Đá Quý', 'Dây Chuyền Trái Tim', 'Khuyên Tai Vàng Xoắn', 'Lắc Tay Xích Vàng', 'Nhẫn Đính Đá Vàng', 'Bộ Trang Sức Cô Dâu Vàng', 'Bông Tai Ngọc Trai', 'Dây Chuyền Lá Vàng'],
    photos: ['1535632066927-ab7c9ab60908', '1599643478518-a784e5dc4c8f', '1611591437281-460bfbe1220a', '1630019852942-f89202989a59', '1602751584552-8ba73aad10e1', '1601121141461-9d6647bca1ed', '1588444837495-c6cfeb53f32d', '1606800052052-a08af7148866', '1492707892479-7bc8d5a4ee93',
      '1617038220319-276d3cfab638', '1633934542430-0905ccb5f050', '1611652022419-a9419f74343d', '1602173574767-37ac01994b2a', '1543294001-f7cd5d7fb516', '1585960622850-ed33c41d6418', '1616837874254-8d5aaa63e273', '1722410180687-b05b50922362', '1599458349289-18f0ee82e6ed', '1631982690223-8aa4be0a2497', '1590166223826-12dee1677420', '1620656798579-1984d9e87df7', '1601821765780-754fa98637c1'],
  },
];

export const descriptionTemplate = (name: string) => `Thiết kế ${name} được tuyển chọn từ bộ sưu tập cao cấp, phù hợp cho những dịp đặc biệt. Chất liệu mềm mại, phom dáng tinh tế và được chăm sóc kỹ lưỡng sau mỗi lần thuê.`;
export const demoSku = (i: number) => `DRESS-${String(i + 1).padStart(4, '0')}`;
const slugify = (value: string) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Tên và 2 ảnh cho sản phẩm demo thứ i (0-based). */
export function demoProduct(i: number) {
  const entry = demoCatalog[i % demoCatalog.length];
  const j = Math.floor(i / demoCatalog.length);
  return {
    entry, j,
    name: entry.names[j % entry.names.length],
    // Ảnh đại diện photos[j] không trùng giữa các sản phẩm (mỗi danh mục có > PRODUCTS_PER_CATEGORY ảnh);
    // ảnh chi tiết lấy lệch PRODUCTS_PER_CATEGORY vị trí.
    images: [entry.photos[j % entry.photos.length], entry.photos[(j + PRODUCTS_PER_CATEGORY) % entry.photos.length]],
  };
}

/** Dữ liệu tạo sản phẩm demo thứ i (dùng cho prisma.product.create). */
export function demoProductData(i: number, categoryId: string) {
  const { entry, j, name, images } = demoProduct(i);
  const pricePerDay = entry.basePrice + (j % 4) * 50000;
  return {
    sku: demoSku(i), name, slug: `${slugify(name)}-${i + 1}`,
    description: descriptionTemplate(name),
    shortDescription: 'Thiết kế thanh lịch cho những khoảnh khắc đáng nhớ.',
    categoryId, pricePerDay,
    price3Days: Math.round((pricePerDay * 2.5) / 10000) * 10000,
    price7Days: pricePerDay * 5,
    depositAmount: pricePerDay * 2,
    brand: 'Maison Élégance',
    material: entry.materials[j % entry.materials.length],
    colorName: entry.colors[j % entry.colors.length],
    sizeLabel: entry.sizes.join(' / '),
    isFeatured: j === 0,
    images: { create: images.map((id, sortOrder) => ({ url: photo(id), altText: sortOrder ? `${name} — chi tiết` : name, sortOrder })) },
    variants: { create: entry.sizes.map((size, index) => ({ size, color: 'default', stockTotal: 2 + ((j + index) % 3) })) },
  };
}

/** Vai trò nội bộ (tài khoản do admin tạo trong trang quản trị). */
export const staffRoles: Array<[name: string, description: string]> = [
  ['ADMIN', 'Quản lý cửa hàng'],
  ['STAFF', 'Nhân viên: thanh toán, đơn hàng, tra cứu kho'],
  ['WAREHOUSE', 'Thủ kho: kho, bảo trì, lịch thuê'],
  ['ACCOUNTANT', 'Kế toán: thanh toán, báo cáo'],
];

/**
 * Cấu hình mặc định [key, value, group]. Nhóm general (key store.*) hiển thị công khai trên website
 * và sửa được trong Admin → Cấu hình. Địa chỉ/liên hệ là dữ liệu mẫu, cần cập nhật thông tin thật.
 */
export const demoSettings: Array<[key: string, value: string, group: string]> = [
  ['store.name', 'Hamin', 'general'],
  ['store.legalName', 'Hộ kinh doanh Hamin', 'general'],
  ['store.tagline', 'Thuê trang phục cho những khoảnh khắc đặc biệt', 'general'],
  ['store.address', '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh', 'general'],
  ['store.phone', '028 1234 5678', 'general'],
  ['store.email', 'lienhe@hamin.vn', 'general'],
  ['store.hours', 'Thứ 2 - Chủ nhật: 9:00 - 21:00', 'general'],
  ['store.foundedYear', '2020', 'general'],
  ['store.about', 'Hamin bắt đầu từ một showroom nhỏ với mong muốn mang đến giải pháp thuê trang phục cao cấp cho những dịp đặc biệt: dạ tiệc, lễ cưới, sự kiện, biểu diễn và cả những bộ ảnh đáng nhớ.\n\nMỗi thiết kế đều được tuyển chọn kỹ lưỡng, vệ sinh chuyên nghiệp và kiểm tra tỉ mỉ sau mỗi lần thuê trước khi đến tay khách hàng tiếp theo.', 'general'],
  ['rental.bufferDays', '1', 'rental'], ['rental.minDays', '1', 'rental'], ['rental.maxDays', '30', 'rental'],
  ['payment.bankName', 'Vietcombank', 'payment'], ['payment.accountNumber', '0123456789', 'payment'], ['payment.accountName', 'HO KINH DOANH HAMIN', 'payment'], ['payment.branch', 'Chi nhánh trung tâm', 'payment'], ['payment.qrUrl', '', 'payment'],
];
