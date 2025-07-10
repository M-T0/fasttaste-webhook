// Import thư viện express để tạo server
const express = require('express');
const app = express();

// Middleware để express có thể đọc được JSON từ request body
app.use(express.json());

// Đây là điểm cuối (endpoint) để nhận request từ Dialogflow
app.post('/api', (req, res) => {
  // Luôn dùng try...catch để bắt mọi lỗi có thể xảy ra, tránh bot bị im lặng
  try {
    const queryResult = req.body.queryResult;
    const intentName = queryResult.intent.displayName;
    const session = req.body.session;
    const parameters = queryResult.parameters;

    let cart = parameters.cart || [];
    let fulfillmentMessages = [];
    let outputContexts = [];

    // --- SỬ DỤNG IF / ELSE IF ĐỂ ĐẢM BẢO TÍNH CHÍNH XÁC ---

    // KỊCH BẢN 1: THÊM MÓN
    if (intentName === 'muathem') {
      let newItems = parameters.mon_an || [];
      if (!Array.isArray(newItems)) { newItems = [newItems]; }

      if (newItems.length > 0) {
        cart = cart.concat(newItems);
        const addedItemsText = newItems.join(', ');
        const responseText = `Đã thêm "${addedItemsText}". Giỏ hàng của bạn hiện có: ${cart.join(', ')}.`;
        
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
    
    // KỊCH BẢN 2: THANH TOÁN
    else if (intentName === 'Thanh-toan') {
      if (cart.length > 0) {
        const orderSummary = cart.join(', ');
        const responseText = `Em xin xác nhận đơn hàng của anh/chị gồm có: ${orderSummary}. Anh/chị vui lòng chọn phương thức nhận hàng ạ:`;
        
        fulfillmentMessages.push({ text: { text: [responseText] } });
        fulfillmentMessages.push({
          payload: { richContent: [[{ type: 'chips', options: [{ text: 'Giao hàng tận nơi' }, { text: 'Đến lấy tại cửa hàng' }] }]] }
        });
        
        outputContexts.push({
          name: `${session}/contexts/choosing-delivery-method`,
          lifespanCount: 2,
          parameters: { cart: cart }
        });
      } else {
        fulfillmentMessages.push({ text: { text: ['Dạ, giỏ hàng của anh/chị đang trống nên chưa thể thanh toán.'] } });
      }
    }
    
    // KỊCH BẢN 3: CHỌN GIAO HÀNG
    else if (intentName === 'Chongiaohang') {
      fulfillmentMessages.push({ text: { text: ['Dạ, anh/chị vui lòng cho em xin địa chỉ và số điện thoại để giao hàng ạ.'] } });
      outputContexts.push({ name: `${session}/contexts/awaiting-address`, lifespanCount: 2 });
    }
    
    // KỊCH BẢN 4: CHỌN ĐẾN LẤY
    else if (intentName === 'Chondenlay') {
      fulfillmentMessages.push({ text: { text: ['Dạ, đơn hàng của anh/chị sẽ được chuẩn bị. Mời anh/chị đến cửa hàng FASTTASTE tại [Điền địa chỉ của bạn] để nhận hàng nhé. Cảm ơn quý khách đã sử dụng sản phẩm bên mình!'] } });
      // Không cần truyền lại giỏ hàng, coi như đã xóa
    }
    
    // KỊCH BẢN 5: CUNG CẤP ĐỊA CHỈ
    else if (intentName === 'Cungcapdiachi') {
      fulfillmentMessages.push({ text: { text: ['Em đã nhận được thông tin. Đơn hàng sẽ được giao đến cho anh/chị trong thời gian sớm nhất. Cảm ơn quý khách đã sử dụng sản phẩm bên mình!'] } });
      // Không cần truyền lại giỏ hàng, coi như đã xóa
    }
    
    // TRƯỜNG HỢP MẶC ĐỊNH
    else {
      fulfillmentMessages.push({ text: { text: [`Webhook đã nhận được intent: ${intentName}. Chức năng này đang được phát triển.`] } });
    }

    // Tạo và gửi phản hồi chuẩn cho Dialogflow ES
    const responseJson = {
      fulfillmentMessages: fulfillmentMessages,
      outputContexts: outputContexts,
    };
    res.status(200).send(responseJson);

  } catch (error) {
    // Nếu có bất kỳ lỗi nghiêm trọng nào, bot sẽ báo lại thay vì im lặng
    console.error('LỖI WEBHOOK NGHIÊM TRỌNG:', error);
    res.status(200).send({
      fulfillmentMessages: [{ text: { text: ['Oops! "Đầu bếp" đã gặp lỗi nghiêm trọng. Vui lòng kiểm tra lại code.'] } }]
    });
  }
});
