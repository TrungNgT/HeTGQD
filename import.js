const fs = require('fs');
const path = require('path');
const { Client } = require('@elastic/elasticsearch');

// Khởi tạo client Elasticsearch
const client = new Client({
  node: 'http://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'XiH66HdPw5EGj72YyWe3'
  }
});

// Đọc dữ liệu từ file dataDoAn.json trong thư mục public
const filePath = path.join(__dirname, 'public', 'dataDoAn.json');

fs.readFile(filePath, 'utf8', async (err, data) => {
  if (err) {
    console.error('Lỗi khi đọc file:', err);
    return;
  }

  const documents = JSON.parse(data);

  try {
    // Sử dụng bulk API để nhập dữ liệu vào Elasticsearch
    const body = documents.flatMap(doc => [
      { index: { _index: 'de_tai', _id: doc.id } },
      doc
    ]);

    const response = await client.bulk({ refresh: true, body });
    
    // In toàn bộ phản hồi từ Elasticsearch
    console.log('Bulk Response:', JSON.stringify(response, null, 2));

    // Kiểm tra lỗi trong phản hồi
    if (response.body.errors) {
      console.error('Lỗi khi nhập dữ liệu:', response.body.errors);
    } else {
      console.log('Dữ liệu đã được nhập thành công!');
    }
  } catch (error) {
    console.error('Lỗi khi kết nối với Elasticsearch:', error);
  }
});
