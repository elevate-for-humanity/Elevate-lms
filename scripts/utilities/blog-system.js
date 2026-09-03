/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

const express = require('express');
const fs = require('fs');
const path = require('path');

class BlogSystem {
  constructor() {
    this.router = express.Router();
    this.setupRoutes();
    this.blogPosts = this.loadBlogPosts();
  }

  loadBlogPosts() {
    // Default blog posts for workforce development
    return [
      {
        id: 'ai-careers-2025',
        title: 'AI Careers in 2025: Complete Guide to High-Paying Opportunities',
        slug: 'ai-careers-2025-complete-guide',
        excerpt:
          'Discover the hottest AI career paths, required skills, and salary expectations for 2025. From machine learning engineers to AI ethics specialists.',
        content: this.getFullBlogContent('ai-careers-2025'),
        author: 'Dr. Sarah Chen',
        publishedAt: '2025-09-10',
        updatedAt: '2025-09-15',
        tags: ['AI', 'careers', 'machine learning', 'data science'],
        category: 'Career Guidance',
        featured: true,
        readTime: 8,
        views: 2340,
        likes: 156,
        shares: 89,
      },
      {
        id: 'federal-funding-guide',
        title: 'Federal Funding for Workforce Development: WIOA, WRG, and More',
        slug: 'federal-funding-workforce-development-guide',
        excerpt:
          'Complete guide to accessing federal funding for career training. Learn about WIOA, Workforce Ready Grants, and other funding opportunities.',
        content: this.getFullBlogContent('federal-funding-guide'),
        author: 'Michael Rodriguez',
        publishedAt: '2025-09-08',
        updatedAt: '2025-09-12',
        tags: ['funding', 'WIOA', 'workforce development', 'grants'],
        category: 'Funding',
        featured: true,
        readTime: 12,
        views: 1890,
        likes: 203,
        shares: 145,
      },
      {
        id: 'data-science-bootcamp-success',
        title: 'From Zero to Data Scientist: Success Stories from Our Bootcamp',
        slug: 'data-science-bootcamp-success-stories',
        excerpt:
          'Real stories from students who transformed their careers through our data science bootcamp. See their journeys and outcomes.',
        content: this.getFullBlogContent('data-science-bootcamp-success'),
        author: 'Jennifer Park',
        publishedAt: '2025-09-05',
        updatedAt: '2025-09-10',
        tags: ['data science', 'bootcamp', 'success stories', 'career change'],
        category: 'Student Success',
        featured: false,
        readTime: 6,
        views: 1456,
        likes: 98,
        shares: 67,
      },
      {
        id: 'apprenticeship-programs-2025',
        title: 'Tech Apprenticeships: Earn While You Learn in 2025',
        slug: 'tech-apprenticeships-earn-while-learn-2025',
        excerpt:
          'Explore paid apprenticeship opportunities in tech. Learn how to get started and what to expect from modern apprenticeship programs.',
        content: this.getFullBlogContent('apprenticeship-programs-2025'),
        author: 'David Kim',
        publishedAt: '2025-09-03',
        updatedAt: '2025-09-08',
        tags: ['apprenticeships', 'tech careers', 'paid training', 'workforce development'],
        category: 'Training Programs',
        featured: false,
        readTime: 10,
        views: 1123,
        likes: 87,
        shares: 54,
      },
      {
        id: 'healthcare-ai-careers',
        title: 'Healthcare AI: The Future of Medical Technology Careers',
        slug: 'healthcare-ai-future-medical-technology-careers',
        excerpt:
          'Discover emerging career opportunities at the intersection of healthcare and AI. From medical imaging to drug discovery.',
        content: this.getFullBlogContent('healthcare-ai-careers'),
        author: 'Dr. Lisa Thompson',
        publishedAt: '2025-09-01',
        updatedAt: '2025-09-05',
        tags: ['healthcare', 'AI', 'medical technology', 'emerging careers'],
        category: 'Industry Insights',
        featured: false,
        readTime: 9,
        views: 987,
        likes: 76,
        shares: 43,
      },
    ];
  }

  getFullBlogContent(postId) {
    const contentMap = {
      'ai-careers-2025': `
        <h2>The AI Revolution is Here</h2>
        <p>Artificial Intelligence is no longer a futuristic concept—it's reshaping industries today. From healthcare to finance, companies are desperately seeking AI talent to stay competitive.</p>

        <h3>Top AI Career Paths for 2025</h3>
        <ul>
          <li><strong>Machine Learning Engineer</strong> - $120K-$200K average salary</li>
          <li><strong>AI Research Scientist</strong> - $150K-$250K average salary</li>
          <li><strong>Data Scientist</strong> - $95K-$165K average salary</li>
          <li><strong>AI Ethics Specialist</strong> - $85K-$140K average salary</li>
          <li><strong>Computer Vision Engineer</strong> - $110K-$180K average salary</li>
        </ul>

        <h3>Required Skills</h3>
        <p>Success in AI careers requires a combination of technical and soft skills:</p>
        <ul>
          <li>Programming languages: Python, R, Java, C++</li>
          <li>Machine learning frameworks: TensorFlow, PyTorch, Scikit-learn</li>
          <li>Statistics and mathematics</li>
          <li>Data visualization tools</li>
          <li>Communication and problem-solving skills</li>
        </ul>

        <h3>Getting Started</h3>
        <p>Our AI Fundamentals program provides hands-on training in these essential skills. With federal funding available through WIOA, you can start your AI career journey today.</p>
      `,
      'federal-funding-guide': `
        <h2>Unlock Your Career Potential with Federal Funding</h2>
        <p>Don't let financial barriers stop you from advancing your career. Federal funding programs can cover 100% of your training costs.</p>

        <h3>Workforce Innovation and Opportunity Act (WIOA)</h3>
        <p>WIOA provides funding for eligible individuals to receive training for in-demand occupations. Benefits include:</p>
        <ul>
          <li>Full tuition coverage for approved programs</li>
          <li>Support services during training</li>
          <li>Career counseling and job placement assistance</li>
          <li>Income support during training (in some cases)</li>
        </ul>

        <h3>Workforce Ready Grants (WRG)</h3>
        <p>State-specific grants that support rapid workforce development in high-demand sectors like technology and healthcare.</p>

        <h3>How to Apply</h3>
        <ol>
          <li>Contact your local American Job Center</li>
          <li>Complete eligibility assessment</li>
          <li>Choose an approved training program</li>
          <li>Submit application with required documentation</li>
          <li>Begin training once approved</li>
        </ol>

        <p>Our team can help guide you through the entire process. Contact us at 317-760-7908 to get started.</p>
      `,
      'data-science-bootcamp-success': `
        <h2>Real Success Stories</h2>
        <p>Meet some of our graduates who transformed their careers through our intensive data science bootcamp.</p>

        <h3>Maria's Journey: From Retail to Tech</h3>
        <p>Maria worked in retail management for 8 years before deciding to make a career change. Through our data science bootcamp and WIOA funding, she landed a role as a Data Analyst at a Fortune 500 company.</p>
        <blockquote>"The bootcamp gave me practical skills I could use immediately. Within 3 months of graduating, I had multiple job offers."</blockquote>

        <h3>James's Transformation: Military to Data Science</h3>
        <p>After serving in the military, James used his GI Bill benefits combined with our program to transition into civilian tech work as a Machine Learning Engineer.</p>

        <h3>Success Metrics</h3>
        <ul>
          <li>94% job placement rate within 6 months</li>
          <li>Average salary increase of 85%</li>
          <li>Students work at Google, Microsoft, Amazon, and more</li>
          <li>100% of graduates report increased job satisfaction</li>
        </ul>
      `,
      'apprenticeship-programs-2025': `
        <h2>The Modern Apprenticeship Advantage</h2>
        <p>Apprenticeships aren't just for traditional trades anymore. Tech companies are embracing apprenticeships as a way to build diverse, skilled teams.</p>

        <h3>What Makes Tech Apprenticeships Different</h3>
        <ul>
          <li>Earn a salary while learning (typically $40K-$60K starting)</li>
          <li>Work on real projects with experienced mentors</li>
          <li>Guaranteed job placement upon completion</li>
          <li>No student debt</li>
          <li>Clear career progression path</li>
        </ul>

        <h3>Available Apprenticeship Tracks</h3>
        <ul>
          <li>Software Development</li>
          <li>Data Analytics</li>
          <li>Cybersecurity</li>
          <li>Cloud Computing</li>
          <li>AI/Machine Learning</li>
        </ul>

        <h3>How to Get Started</h3>
        <p>Our apprenticeship programs partner with leading employers to provide structured learning experiences. Applications are accepted quarterly.</p>
      `,
      'healthcare-ai-careers': `
        <h2>Where Healthcare Meets AI</h2>
        <p>The healthcare industry is experiencing an AI revolution, creating unprecedented career opportunities for those with the right skills.</p>

        <h3>Emerging Roles</h3>
        <ul>
          <li><strong>Medical AI Specialist</strong> - Develop AI solutions for clinical applications</li>
          <li><strong>Healthcare Data Scientist</strong> - Analyze patient data to improve outcomes</li>
          <li><strong>Clinical Informatics Specialist</strong> - Bridge technology and patient care</li>
          <li><strong>AI Ethics in Healthcare</strong> - Ensure responsible AI deployment</li>
        </ul>

        <h3>Industry Growth</h3>
        <p>The healthcare AI market is projected to reach $102 billion by 2028, creating thousands of new jobs across the sector.</p>

        <h3>Required Background</h3>
        <p>While a healthcare background is helpful, it's not required. Our programs teach both the technical AI skills and healthcare domain knowledge needed for success.</p>
      `,
    };

    return contentMap[postId] || '<p>Content coming soon...</p>';
  }

  setupRoutes() {
    // Get all blog posts
    this.router.get('/api/blog/posts', this.getAllPosts.bind(this));

    // Get featured posts
    this.router.get('/api/blog/featured', this.getFeaturedPosts.bind(this));

    // Get single post
    this.router.get('/api/blog/posts/:slug', this.getPost.bind(this));

    // Get posts by category
    this.router.get('/api/blog/category/:category', this.getPostsByCategory.bind(this));

    // Get posts by tag
    this.router.get('/api/blog/tag/:tag', this.getPostsByTag.bind(this));

    // Search posts
    this.router.get('/api/blog/search', this.searchPosts.bind(this));

    // Get blog analytics
    this.router.get('/api/blog/analytics', this.getBlogAnalytics.bind(this));

    // Like a post
    this.router.post('/api/blog/posts/:id/like', this.likePost.bind(this));

    // Share a post
    this.router.post('/api/blog/posts/:id/share', this.sharePost.bind(this));

    // Durable injection worker endpoint
    this.router.post('/api/blog/durable-inject', this.handleDurableInjection.bind(this));
    this.router.get('/api/blog/durable-status', this.checkDurableStatus.bind(this));
  }

  async getAllPosts(req, res) {
    try {
      const { page = 1, limit = 10, sortBy = 'publishedAt', order = 'desc' } = req.query;

      const posts = [...this.blogPosts];

      // Sort posts
      posts.sort((a, b) => {
        if (order === 'desc') {
          return new Date(b[sortBy]) - new Date(a[sortBy]);
        }
        return new Date(a[sortBy]) - new Date(b[sortBy]);
      });

      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedPosts = posts.slice(startIndex, endIndex);

      res.json({
        posts: paginatedPosts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(posts.length / limit),
          totalPosts: posts.length,
          hasNext: endIndex < posts.length,
          hasPrev: startIndex > 0,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getFeaturedPosts(req, res) {
    try {
      const featuredPosts = this.blogPosts.filter((post) => post.featured);
      res.json({ posts: featuredPosts });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPost(req, res) {
    try {
      const { slug } = req.params;
      const post = this.blogPosts.find((p) => p.slug === slug);

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Increment view count
      post.views += 1;

      res.json({ post });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPostsByCategory(req, res) {
    try {
      const { category } = req.params;
      const posts = this.blogPosts.filter(
        (post) => post.category.toLowerCase() === category.toLowerCase(),
      );

      res.json({ posts, category });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPostsByTag(req, res) {
    try {
      const { tag } = req.params;
      const posts = this.blogPosts.filter((post) =>
        post.tags.some((t) => t.toLowerCase() === tag.toLowerCase()),
      );

      res.json({ posts, tag });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async searchPosts(req, res) {
    try {
      const { q, category, tag } = req.query;

      let posts = [...this.blogPosts];

      // Text search
      if (q) {
        const searchTerm = q.toLowerCase();
        posts = posts.filter(
          (post) =>
            post.title.toLowerCase().includes(searchTerm) ||
            post.excerpt.toLowerCase().includes(searchTerm) ||
            post.content.toLowerCase().includes(searchTerm) ||
            post.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
        );
      }

      // Filter by category
      if (category) {
        posts = posts.filter((post) => post.category.toLowerCase() === category.toLowerCase());
      }

      // Filter by tag
      if (tag) {
        posts = posts.filter((post) =>
          post.tags.some((t) => t.toLowerCase() === tag.toLowerCase()),
        );
      }

      res.json({ posts, query: { q, category, tag } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getBlogAnalytics(req, res) {
    try {
      const analytics = {
        totalPosts: this.blogPosts.length,
        totalViews: this.blogPosts.reduce((sum, post) => sum + post.views, 0),
        totalLikes: this.blogPosts.reduce((sum, post) => sum + post.likes, 0),
        totalShares: this.blogPosts.reduce((sum, post) => sum + post.shares, 0),
        averageReadTime: Math.round(
          this.blogPosts.reduce((sum, post) => sum + post.readTime, 0) / this.blogPosts.length,
        ),
        topPosts: this.blogPosts
          .sort((a, b) => b.views - a.views)
          .slice(0, 5)
          .map((post) => ({
            title: post.title,
            slug: post.slug,
            views: post.views,
            likes: post.likes,
          })),
        categories: this.getCategories(),
        tags: this.getTags(),
      };

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async likePost(req, res) {
    try {
      const { id } = req.params;
      const post = this.blogPosts.find((p) => p.id === id);

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      post.likes += 1;

      res.json({
        success: true,
        likes: post.likes,
        message: 'Post liked successfully',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async sharePost(req, res) {
    try {
      const { id } = req.params;
      const { platform } = req.body;

      const post = this.blogPosts.find((p) => p.id === id);

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      post.shares += 1;

      const shareUrl = `https://elevateforhumanity.org/blog/${post.slug}`;
      const shareText = `${post.title} - ${post.excerpt}`;

      const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        email: `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      };

      res.json({
        success: true,
        shares: post.shares,
        shareUrl: shareUrls[platform] || shareUrl,
        message: 'Share URL generated successfully',
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  getCategories() {
    const categories = [...new Set(this.blogPosts.map((post) => post.category))];
    return categories.map((category) => ({
      name: category,
      count: this.blogPosts.filter((post) => post.category === category).length,
    }));
  }

  getTags() {
    const allTags = this.blogPosts.flatMap((post) => post.tags);
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags.map((tag) => ({
      name: tag,
      count: allTags.filter((t) => t === tag).length,
    }));
  }

  getRouter() {
    return this.router;
  }

  // Durable injection handler - triggered via Zapier
  async handleDurableInjection(req, res) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/internal/durable-inject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: process.env.DURABLE_EMAIL || 'Elevateforhumanity@gmail.com',
          password: process.env.DURABLE_PASSWORD,
        }),
      });

      const data = await response.json();

      res.json({
        success: data.success || false,
        message: data.message || data.error,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Check if enrollment script is present on Durable site
  async checkDurableStatus(req, res) {
    try {
      const siteResponse = await fetch('https://elevateforhumanity.org');
      const html = await siteResponse.text();

      const hasEnrollmentScript =
        html.includes('enrollment-injector.js') || html.includes('Enroll in Our Programs');

      res.json({
        success: true,
        hasEnrollmentScript,
        message: hasEnrollmentScript
          ? 'Enrollment script is present'
          : 'Enrollment script not found',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = BlogSystem;
