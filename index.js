const express = require('express');
const app = express();
app.use(express.json());

// Endpoint chính để nhận request từ Dialogflow
app.post('/api', (req, res) => {
  // Luôn dùng try...catch để bắt mọi lỗi, tránh bot bị im lặng
  try {
    
    const queryResult = req.body.queryResult;
    const intentName = queryResult.intent.displayName.toLowerCase(); // Chuyển tên intent về chữ thường để tránh lỗi
    const session = req.body.session;
    const parameters = queryResult.parameters;
    let cart = parameters.cart || [];
    let fulfillmentMessages = [];
    let outputContexts = [];
    if (intentName === 'muathem') {
      let newItems = parameters.mon_an || [];
      if (!Array.isArray(newItems)) { newItems = [newItems]; }

      if (newItems.length > 0) {
        cart = cart.concat(newItems);
        const addedItemsText = newItems.join(', ');
        const responseText = `Đã thêm "${addedItemsText}" vào giỏ hàng. Giỏ hàng của bạn hiện có: ${cart.join(', ')}.`;
        
        fulfillmentMessages.push({ text: { text: [responseText] } });
        fulfillmentMessages.push({
          payload: { richContent: [[{ type: 'chips', options: [{ text: 'Xem Menu' }, { text: 'Thanh toán' }] }]] }
        });

       
        outputContexts.push({
          name: `${session}/contexts/dang-chon-mon`,
          lifespanCount: 5,
          parameters: { cart: cart }
        });
      } else {
        fulfillmentMessages.push({ text: { text: ["Xin lỗi, tôi không bắt được món ăn bạn vừa gọi."] } });
      }
    }

    // KỊCH BẢN 2: KHÁCH BẤM THANH TOÁN
    else if (intentName === 'thanh-toan') {
      if (cart.length > 0) {
        const orderSummary = cart.join(', ');
        const responseText = `Em xin xác nhận đơn hàng của anh/chị gồm có: ${orderSummary}. Anh/chị vui lòng chọn phương thức nhận hàng ạ:`;
        
        fulfillmentMessages.push({ text: { text: [responseText] } });
        fulfillmentMessages.push({
          payload: { richContent: [[{ type: 'chips', options: [{ text: 'Giao hàng tận nơi' }, { text: 'Đến lấy tại cửa hàng' }] }]] }
        });
        
        // Tạo context mới và "chuyển" giỏ hàng sang cho nó
        outputContexts.push({
          name: `${session}/contexts/dang-chon-phuong-thuc`,
          lifespanCount: 2,
          parameters: { cart: cart }
        });
      } else {
        fulfillmentMessages.push({ text: { text: ['Dạ, giỏ hàng của anh/chị đang trống nên chưa thể thanh toán.'] } });
      }
    }
    
    // KỊCH BẢN 3: KHÁCH CHỌN GIAO HÀNG
    else if (intentName === 'chongiaohang') {
      fulfillmentMessages.push({ text: { text: ['Dạ, anh/chị vui lòng cho em xin địa chỉ và số điện thoại để giao hàng ạ.'] } });
      // Tạo context mới để chờ khách nhập địa chỉ
      outputContexts.push({ name: `${session}/contexts/cho-nhap-dia-chi`, lifespanCount: 2 });
    }
    
    // KỊCH BẢN 4: KHÁCH CHỌN ĐẾN LẤY
    else if (intentName === 'chondenlay') {
      fulfillmentMessages.push({ text: { text: ['Dạ, đơn hàng của anh/chị sẽ được chuẩn bị. Mời anh/chị đến cửa hàng FASTTASTE tại [Điền địa chỉ của bạn] để nhận hàng nhé. Cảm ơn quý khách đã tin dùng sản phẩm của FASTTASTE!'] } });
      // Không cần truyền lại giỏ hàng, coi như đã xóa
    }
    
    // KỊCH BẢN 5: KHÁCH CUNG CẤP ĐỊA CHỈ
    else if (intentName === 'cungcapdiachi') {
      // const address = queryResult.queryText; // Có thể lấy địa chỉ để lưu lại nếu cần
      fulfillmentMessages.push({ text: { text: ['Em đã nhận được thông tin. Đơn hàng sẽ được giao đến cho anh/chị trong thời gian sớm nhất. Cảm ơn quý khách đã tin dùng sản phẩm của FASTTASTE!'] } });
      // Không cần truyền lại giỏ hàng, coi như đã xóa
    }
    
    // TRƯỜNG HỢP MẶC ĐỊNH
    else {
      fulfillmentMessages.push({ text: { text: [`Webhook đã nhận được intent: ${intentName}. Chức năng này đang được phát triển.`] } });
    }

    // --- TẠO VÀ GỬI PHẢN HỒI ---
    const responseJson = {
      fulfillmentMessages: fulfillmentMessages,
      outputContexts: outputContexts,
    };
    return res.status(200).send(responseJson);

  } catch (error) {
    // Nếu có bất kỳ lỗi nghiêm trọng nào, bot sẽ báo lại thay vì im lặng
    console.error('!!! LỖI WEBHOOK NGHIÊM TRỌNG !!!:', error);
    return res.status(200).send({
      fulfillmentMessages: [{
        text: {
          text: ['Oops! "Đầu bếp" đã gặp lỗi nghiêm trọng. Vui lòng kiểm tra log trên Vercel.']
        }
      }]
    });
  }
});

// Xuất app để Vercel có thể sử dụng
module.exports = app;
