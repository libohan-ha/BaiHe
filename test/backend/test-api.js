const http = require('http');

const BASE_URL = 'http://localhost:3000';

const request = (method, path, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 API 接口测试');
  console.log('='.repeat(60));
  console.log();

  let token = '';
  let userId = '';
  let articleId = '';

  try {
    // 1. 健康检查
    console.log('📌 测试 1: 健康检查');
    console.log('-'.repeat(40));
    const health = await request('GET', '/api/health');
    console.log('状态:', health.status);
    console.log('响应:', JSON.stringify(health.data, null, 2));
    console.log();

    // 2. 获取标签列表
    console.log('📌 测试 2: 获取标签列表');
    console.log('-'.repeat(40));
    const tags = await request('GET', '/api/tags');
    console.log('状态:', tags.status);
    console.log('响应:', JSON.stringify(tags.data, null, 2));
    console.log();

    // 3. 获取文章列表
    console.log('📌 测试 3: 获取文章列表');
    console.log('-'.repeat(40));
    const articles = await request('GET', '/api/articles');
    console.log('状态:', articles.status);
    console.log('文章数量:', articles.data.data?.articles?.length || 0);
    if (articles.data.data?.articles?.length > 0) {
      articleId = articles.data.data.articles[0].id;
      console.log('第一篇文章ID:', articleId);
    }
    console.log();

    // 4. 获取文章详情
    if (articleId) {
      console.log('📌 测试 4: 获取文章详情');
      console.log('-'.repeat(40));
      const articleDetail = await request('GET', `/api/articles/${articleId}`);
      console.log('状态:', articleDetail.status);
      console.log('文章标题:', articleDetail.data.data?.title);
      console.log();
    }

    // 5. 用户登录
    console.log('📌 测试 5: 用户登录');
    console.log('-'.repeat(40));
    const login = await request('POST', '/api/auth/login', {
      email: 'user1@example.com',
      password: '123456'
    });
    console.log('状态:', login.status);
    if (login.data.data?.token) {
      token = login.data.data.token;
      userId = login.data.data.user.id;
      console.log('登录成功!');
      console.log('用户:', login.data.data.user.username);
      console.log('Token:', token.substring(0, 50) + '...');
    } else {
      console.log('登录失败:', login.data.message);
    }
    console.log();

    // 6. 获取当前用户信息
    if (token) {
      console.log('📌 测试 6: 获取当前用户信息');
      console.log('-'.repeat(40));
      const profile = await request('GET', '/api/auth/profile', null, {
        'Authorization': `Bearer ${token}`
      });
      console.log('状态:', profile.status);
      console.log('用户信息:', JSON.stringify(profile.data.data, null, 2));
      console.log();
    }

    // 7. 更新用户信息
    if (token) {
      console.log('📌 测试 7: 更新用户信息');
      console.log('-'.repeat(40));
      const update = await request('PUT', '/api/auth/profile', {
        bio: '测试更新个人简介 - ' + new Date().toISOString()
      }, {
        'Authorization': `Bearer ${token}`
      });
      console.log('状态:', update.status);
      console.log('响应:', update.data.message);
      console.log();
    }

    // 8. 创建文章
    if (token) {
      console.log('📌 测试 8: 创建文章');
      console.log('-'.repeat(40));
      const createArticle = await request('POST', '/api/articles', {
        title: '测试文章 - ' + new Date().toISOString(),
        summary: '这是一篇测试文章',
        content: '# 测试文章\n\n这是一篇通过API创建的测试文章。\n\n```javascript\nconsole.log("Hello World");\n```',
        status: 'PUBLISHED'
      }, {
        'Authorization': `Bearer ${token}`
      });
      console.log('状态:', createArticle.status);
      if (createArticle.data.data?.id) {
        articleId = createArticle.data.data.id;
        console.log('文章创建成功! ID:', articleId);
        console.log('标题:', createArticle.data.data.title);
      } else {
        console.log('响应:', JSON.stringify(createArticle.data, null, 2));
      }
      console.log();
    }

    // 9. 获取当前用户的收藏列表
    if (token) {
      console.log('📌 测试 9: 获取收藏列表');
      console.log('-'.repeat(40));
      const collections = await request('GET', '/api/collections', null, {
        'Authorization': `Bearer ${token}`
      });
      console.log('状态:', collections.status);
      console.log('收藏数量:', collections.data.data?.collections?.length || 0);
      console.log();
    }

    // 10. 收藏文章
    if (token && articleId) {
      console.log('📌 测试 10: 收藏文章');
      console.log('-'.repeat(40));
      const collect = await request('POST', '/api/collections', {
        articleId: articleId
      }, {
        'Authorization': `Bearer ${token}`
      });
      console.log('状态:', collect.status);
      console.log('响应:', collect.data.message);
      console.log();
    }

    // 11. 发表评论
    if (token && articleId) {
      console.log('📌 测试 11: 发表评论');
      console.log('-'.repeat(40));
      const comment = await request('POST', '/api/comments', {
        content: '这是一条测试评论 - ' + new Date().toISOString(),
        articleId: articleId
      }, {
        'Authorization': `Bearer ${token}`
      });
      console.log('状态:', comment.status);
      if (comment.data.data?.id) {
        console.log('评论成功! ID:', comment.data.data.id);
      } else {
        console.log('响应:', JSON.stringify(comment.data, null, 2));
      }
      console.log();
    }

    // 12. 测试未授权访问
    console.log('📌 测试 12: 未授权访问测试');
    console.log('-'.repeat(40));
    const unauthorized = await request('GET', '/api/auth/profile');
    console.log('状态:', unauthorized.status);
    console.log('预期: 401 未授权');
    console.log('实际:', unauthorized.data.message);
    console.log();

    console.log('='.repeat(60));
    console.log('✅ 所有测试完成!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
  }
}

runTests();
