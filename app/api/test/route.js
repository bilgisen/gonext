export async function GET() {
  return Response.json({
    success: true,
    message: 'API endpoint working!',
    data: {
      news: [
        {
          id: 1,
          title: 'Test Haber 1',
          seo_title: 'Test SEO Title 1',
          slug: 'test-haber-1',
          status: 'published',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Test Haber 2',
          seo_title: 'Test SEO Title 2',
          slug: 'test-haber-2',
          status: 'published',
          created_at: new Date().toISOString()
        }
      ],
      total: 2,
    }
  });
}
