// Import thư viện express để tạo server
const express = require('express');
const app = express();

// Middleware để express có thể đọc được JSON từ request body
app.use(express.json());

// Đây là điểm cuối (endpoint) để nhận request từ Dialogflow
app.post('/api', (req, res) => {
  try {
    const queryResult = req.body.queryResult;
    const intentName = queryResult.intent.displayName;
    const session = req.body.session; // Lấy session path của Dialogflow ES
    const parameters = queryResult.parameters;

    // Lấy giỏ hàng từ parameters. Đây là cách Dialogflow ES truyền dữ liệu từ context.
    let cart = parameters.cart || [];

    let fulfillmentMessages = [];
    let outputContexts = [];

    switch (intentName) {
      case 'Xem Menu - chonmon':
      case 'muathem': {
        let newItems = parameters.mon_an || [];
        if (!Array.isArray(newItems)) { newItems = [newItems]; }

        if (newItems.length > 0) {
          cart = cart.concat(newItems);
          const addedItemsText = newItems.join(', ');
          const responseText = `Đã thêm "${addedItemsText}" vào giỏ hàng. Giỏ hàng của bạn hiện có: ${cart.join(', ')}.`;
          
          fulfillmentMessages.push({ text: { text: [responseText] } });
          fulfillmentMessages.push({
            payload: { richContent: [[{ type: 'chips', options: [{ text: 'Xem Gà Lẻ' }, { text: 'Xem Món Ăn Kèm' }, { text: 'Xem Nước Uống & Kem' }, { text: 'Thanh toán' }] }]] }
          });

          // *** CÁCH LƯU GIỎ HÀNG CHUẨN CỦA DIALOGFLOW ES ***
          // Gửi lại giỏ hàng đã cập nhật trong parameters của output context
          outputContexts.push({
            name: `${session}/contexts/dang-chon-mon`,
            lifespanCount: 5,
            parameters: { cart: cart }
          });
        } else {
          fulfillmentMessages.push({ text: { text: ["Xin lỗi, tôi chưa rõ bạn muốn chọn món nào."] } });
        }
        break;
      }

      case 'Thanh-toan': {
        // Giỏ hàng 'cart' ở đây sẽ được lấy đúng từ context 'dang-chon-mon'
        if (cart.length > 0) {
          const orderSummary = cart.join(', ');
          const responseText = `Em xin xác nhận đơn hàng của anh/chị gồm có: ${orderSummary}. Anh/chị vui lòng chọn phương thức nhận hàng ạ:`;
          
          fulfillmentMessages.push({ text: { text: [responseText] } });
          fulfillmentMessages.push({
            payload: { richContent: [[{ type: 'chips', options: [{ text: 'Giao hàng tận nơi' }, { text: 'Đến lấy tại cửa hàng' }] }]] }
          });
          
          // Tạo context mới và truyền giỏ hàng sang
          outputContexts.push({
            name: `${session}/contexts/choosing-delivery-method`,
            lifespanCount: 2,
            parameters: { cart: cart }
          });
        } else {
          fulfillmentMessages.push({ text: { text: ['Dạ, giỏ hàng của anh/chị đang trống nên chưa thể thanh toán.'] } });
        }
        break;
      }
      
      // Các case còn lại không cần thay đổi nhiều
      case 'ChonGiaoHang': {
        fulfillmentMessages.push({ text: { text: ['Dạ, anh/chị vui lòng cho em xin địa chỉ và số điện thoại để giao hàng ạ.'] } });
        outputContexts.push({ name: `${session}/contexts/awaiting-address`, lifespanCount: 2 });
        break;
      }

      case 'ChonDenLay': {
        fulfillmentMessages.push({ text: { text: ['Dạ, đơn hàng của anh/chị sẽ được chuẩn bị. Mời anh/chị đến cửa hàng FASTTASTE tại [Điền địa chỉ của bạn] để nhận hàng nhé. Cảm ơn quý khách đã sử dụng sản phẩm bên mình!'] } });
        // Không cần truyền lại giỏ hàng, coi như đã xóa
        break;
      }

      case 'CungCapDiaChi': {
        fulfillmentMessages.push({ text: { text: ['Em đã nhận được thông tin. Đơn hàng sẽ được giao đến cho anh/chị trong thời gian sớm nhất. Cảm ơn quý khách đã sử dụng sản phẩm bên mình!'] } });
        // Không cần truyền lại giỏ hàng, coi như đã xóa
        break;
      }

      default: {
        fulfillmentMessages.push({ text: { text: [`Webhook đang phát triển, đã nhận được intent: ${intentName}`] } });
        break;
      }
    }

    // Cấu trúc phản hồi chuẩn cho Dialogflow ES
    const responseJson = {
      fulfillmentMessages: fulfillmentMessages,
      outputContexts: outputContexts,
    };
    res.status(200).send(responseJson);

  } catch (error) {
    console.error('LỖI WEBHOOK:', error);
    res.status(200).send({
      fulfillmentMessages: [{ text: { text: ['Oops! Có lỗi xảy ra ở phía đầu bếp. Vui lòng thử lại.'] } }]
    });
  }
});

module.exports = app;
