import React, { useState, useEffect } from 'react';
import './Home.css';
const removeAccents = require('remove-accents');
const HomePage = () => {
  const [mssv, setMssv] = useState('');
  const [khoa, setKhoa] = useState('');
  const [tenDeTai, setTenDeTai] = useState('');
  const [motaDeTai, setMotaDeTai] = useState('');
  const [giangVien, setGiangVien] = useState('');
  const [giangVienList, setGiangVienList] = useState([]);
  const [topGiangVien, setTopGiangVien] = useState([]);
  const [selectedGiangVien, setSelectedGiangVien] = useState([]);
  const [he, setHe] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [doanData, setDoanData] = useState([]); // Danh sách đồ án
  const khoaList = ['Khoa Khoa học Máy tính', 'Khoa Kỹ thuật Máy tính'];

  useEffect(() => {
    // Fetch the GiangVienList.json file
    fetch('/GiangVienList.json')
      .then((response) => response.json())
      .then((data) => {
        if (khoa) {
          setGiangVienList(data[khoa] || []); // Use the data for the selected khoa
        } else {
          setGiangVienList([]);
        }
      })
      .catch((error) => {
        console.error('Error loading GiangVienList.json:', error);
      });
  }, [khoa]); // Only re-run when `khoa` changes
  useEffect(() => {
    fetch('/dataDoAn.json') // Đọc file JSON
      .then((response) => response.json()) // Parse JSON
      .then((data) => {
        setDoanData(data); // Lưu dữ liệu vào state `doanData`
      })
      .catch((error) => {
        console.error('Error loading dataDoAn.json:', error); // Ghi log lỗi
        setErrorMessage('Không thể tải danh sách đồ án.'); // Cập nhật thông báo lỗi
      });
  }, []); // Chạy một lần khi component được render lần đầu
  const getTopGiangVien = async ( tenDeTai, motaDeTai, doanData, selectedGiangVien) => {
    try {
      // Gọi API search với tiêu đề và mô tả đề tài đã loại bỏ dấu
      const normalizedTenDeTai = removeAccents(tenDeTai);
      const normalizedMotaDeTai = removeAccents(motaDeTai);
      const response = await fetch(
        `http://localhost:3001/search?q=${normalizedTenDeTai + " " + normalizedMotaDeTai}`
      );
  
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
  
      const searchResults = await response.json();
  
      // Lấy danh sách kết quả và tính điểm
      const results = searchResults|| [];
      const maxScore = results.length > 0 ? results[0]._score : 1; // Điểm cao nhất
      //console.log(maxScore);
      // Duyệt qua danh sách giảng viên và tính toán điểm
      //console.log(doanData[0].Khoa + "   " +khoa);  
      const scoredGiangVien = doanData
      .filter((gv) => gv.Khoa === khoa) 
      .map((gv) => {
        //console.log('Giảng viên có khoa trùng với khoa chọn:', gv);  
        const matchingRecords = results.filter(
          (record) => record._id=== gv.id.toString()
        );
        const totalScore =
          matchingRecords.reduce((sum, record) => sum + (record._score / maxScore) * 2, 0);
        
        const selectedBonus = selectedGiangVien.includes(gv["Tên giảng viên"]) ? 1 : 0;
        console.log(totalScore);
        return {
          giangVien: gv,
          detai: gv["Tên đề tài"],
          score: totalScore + selectedBonus,
        };
      });
      const topGiangVien = scoredGiangVien.length > 0
      ? scoredGiangVien.sort((a, b) => b.score - a.score).slice(0, 5)
      : doanData.slice(0, 5); 
        
  
      return topGiangVien;
    } catch (error) {
      console.error("Error calculating scores:", error);
      return [];
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();

    // Kiểm tra nếu các trường bắt buộc chưa được nhập
    if (!mssv || !he || !khoa || !tenDeTai || !motaDeTai) {
      setErrorMessage('Vui lòng nhập đầy đủ tất cả các trường có dấu sao.');
      return;
    }
    getTopGiangVien(tenDeTai, motaDeTai, doanData, selectedGiangVien).then((topGiangVien) => {
        console.log("Top 5 giảng viên:", topGiangVien);
        setTopGiangVien(topGiangVien); 
    });
    
    // Xử lý dữ liệu khi người dùng gửi form
    setErrorMessage(''); // Reset thông báo lỗi nếu dữ liệu hợp lệ
    console.log({
      Mssv: mssv,
      He: he,
      Khoa: khoa,
      TenDeTai: tenDeTai,
      MotaDeTai: motaDeTai,
      GiangVien: selectedGiangVien,
      //normalizedTenDeTai: normalizedTenDeTai,
    });
    console.log(selectedGiangVien);
  };

  const handleGiangVienChange = (e) => {
    setGiangVien(e.target.value);
  };

  const handleAddGiangVien = () => {
    if (giangVien && !selectedGiangVien.includes(giangVien)) {
      setSelectedGiangVien([...selectedGiangVien, giangVien]);
      setGiangVien('');
    }
  };

  const handleRemoveGiangVien = (giangVienName) => {
    setSelectedGiangVien(selectedGiangVien.filter(gv => gv !== giangVienName));
  };

  const heList = [
    'ThSKH', 'CNKT', 'KSCQ', 'KSTN', 'CTTT', 'CNKH', 'Viet-Phap', 
    'KSCLC', 'CN', 'ThSKT', 'HEDSPI'
  ];

  return (
    <div>
      <h1>Trang Hỗ trợ Lựa chọn Giảng viên Hướng dẫn</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="mssv">Mã số sinh viên (MSSV): <span style={{ color: 'red' }}>*</span></label>
          <input
            type="text"
            id="mssv"
            value={mssv}
            onChange={(e) => setMssv(e.target.value)}
            placeholder="Nhập MSSV"
            required
          />
        </div>

        <div>
          <label htmlFor="he">Hệ: <span style={{ color: 'red' }}>*</span></label>
          <select
            id="he"
            value={he}
            onChange={(e) => setHe(e.target.value)}
            required
          >
            <option value="">Chọn Hệ</option>
            {heList.map((h, index) => (
              <option key={index} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="khoa">Khoa: <span style={{ color: 'red' }}>*</span></label>
          <select
            id="khoa"
            value={khoa}
            onChange={(e) => setKhoa(e.target.value)}
            required
          >
            <option value="">Chọn Khoa</option>
            {khoaList.map((k, index) => (
              <option key={index} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tenDeTai">Tên đề tài: <span style={{ color: 'red' }}>*</span></label>
          <input
            type="text"
            id="tenDeTai"
            value={tenDeTai}
            onChange={(e) => setTenDeTai(e.target.value)}
            placeholder="Nhập Tên đề tài"
            required
          />
        </div>

        <div>
          <label htmlFor="motaDeTai">Mô tả đề tài: <span style={{ color: 'red' }}>*</span></label>
          <input
            type="text"
            id="motaDeTai"
            value={motaDeTai}
            onChange={(e) => setMotaDeTai(e.target.value)}
            placeholder="Nhập Mô tả đề tài"
            required
          />
        </div>

        <div>
          <label htmlFor="giangVien">Giảng viên hướng dẫn:</label>
          <input
            type="text"
            id="giangVien"
            value={giangVien}
            onChange={handleGiangVienChange}
            placeholder="Nhập tên giảng viên"
            list="giangVienList"
          />
          <datalist id="giangVienList">
            {giangVienList.map((gv, index) => (
              <option key={index} value={gv} />
            ))}
          </datalist>
          <button type="button" onClick={handleAddGiangVien}>
            Thêm giảng viên
          </button>
        </div>

        {selectedGiangVien.length > 0 && (
          <div>
            <h3>Giảng viên đã chọn:</h3>
            <ul>
              {selectedGiangVien.map((gv, index) => (
                <li key={index}>
                  {gv}
                  <button type="button" onClick={() => handleRemoveGiangVien(gv)}>
                    X
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

        <button type="submit">Submit</button>
        
      </form>
      {topGiangVien.length > 0 && (
        <div className="result-container">
          <h3>Top 5 Giảng viên Hướng dẫn</h3>
          <ul className="result-list">
            {topGiangVien.map((gv, index) => (
              <li key={index} className="result-item">
                <div style={{ color: 'red', fontWeight : 'bold' }}>Tên Giảng viên: {gv.giangVien["Tên giảng viên"]}</div>
                <div>Đề tài: {gv.detai}</div>
                <div>Khoa: {gv.giangVien["Khoa"]}</div>
                <div style={{ color: 'green', fontStyle: 'Italic' }}>Score: {gv.score}</div>
               
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HomePage;
