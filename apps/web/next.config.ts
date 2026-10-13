const nextConfig = {
  images: {
    remotePatterns: [
      // Ảnh sản phẩm do admin nhập có thể ở bất kỳ host HTTPS nào (Cloudinary, S3...).
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;