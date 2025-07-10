// Import thư viện express để tạo server
const express = require('express');
const app = express();

// Middleware để express có thể đọc được JSON từ request body
app.use(express.json());

// Đây là điểm cuối (endpoint) để nhận request từ Dialogflow
app.post('/api', (req, res) => {
  try {
    const intentName = req.body.queryResult.intent.displayName;
    const sessionPath = (req.body.sessionInfo && req.body.sessionInfo.session) ? req.body.sessionInfo.session : '';
    const sessionInfo = req.body.sessionInfo || {};
    const sessionParams = sessionInfo.parameters || {};
    let cart = sessionParams.cart || [];

    let fulfillmentMessages = [];
    let outputContexts = [];

    switch (intentName) {
      case 'Xem Menu - chonmon':
      case 'muathem': {
        let newItems = req.body.queryResult.parameters.mon_an || [];
        if (!Array.isArray(newItems)) {
          newItems = [newItems];
        }

        if (newItems.length > 0) {
          cart = cart.concat(newItems);
          const addedItemsText = newItems.join(', ');
          const responseText = `Đã thêm "${addedItemsText}" vào giỏ hàng. Giỏ hàng của bạn hiện có: ${cart.join(', ')}.`;
          const textMessage = { text: { text: [responseText] } };
          const chipsMessage = {
            payload: {
              richContent: [[{
                type: 'chips',
                options: [
                  { text: 'Xem Gà Lẻ' },
                  { text: 'Xem Món Ăn Kèm' },
                  { text: 'Xem Nước Uống & Kem' },
                  { text: 'Thanh toán' }
                ]
              }]]
            }
          };
          fulfillmentMessages.push(textMessage, chipsMessage);
          if (sessionPath) {
            outputContexts.push({ name: `${sessionPath}/contexts/dang-chon-mon`, lifespanCount: 5 });
          }
        } else {
          fulfillmentMessages.push({ text: { text: ["Xin lỗi, tôi chưa rõ bạn muốn chọn món nào."] } });
        }
        break;
      }

      // === LOGIC THANH TOÁN MỚI BẮT ĐẦU TỪ ĐÂY ===
      case 'Thanh-toan': {
        if (cart.length > 0) {
          const orderSummary = cart.join(', ');
          const responseText = `Em xin xác nhận đơn hàng của anh/chị gồm có: ${orderSummary}. Anh/chị vui lòng chọn phương thức nhận hàng ạ:`;
          const textMessage = { text: { text: [responseText] } };
          const chipsMessage = {
            payload: {
              richContent: [[{
                type: 'chips',
                options: [
                  { text: 'Giao hàng tận nơi' },
                  { text: 'Đến lấy tại cửa hàng' }
                ]
              }]]
            }
          };
          fulfillmentMessages.push(textMessage, chipsMessage);
          if (sessionPath) {
            outputContexts.push({ name: `${sessionPath}/contexts/choosing-delivery-method`, lifespanCount: 2 });
          }
        } else {
          // Xử lý khi giỏ hàng trống
          const responseText = 'Dạ, giỏ hàng của anh/chị đang trống nên chưa thể thanh toán. Anh/chị có muốn xem thực đơn không?';
          fulfillmentMessages.push({ text: { text: [responseText] } });
        }
        break;
      }

      case 'ChonGiaoHang': {
        const responseText = 'Dạ, anh/chị vui lòng cho em xin địa chỉ và số điện thoại để giao hàng ạ.';
        fulfillmentMessages.push({ text: { text: [responseText] } });
        if (sessionPath) {
          outputContexts.push({ name: `${sessionPath}/contexts/awaiting-address`, lifespanCount: 2 });
        }
        break;
      }

      case 'ChonDenLay': {
        const responseText = 'Dạ, đơn hàng của anh/chị sẽ được chuẩn bị. Mời anh/chị đến cửa hàng FASTTASTE tại [Điền địa chỉ của bạn] để nhận hàng nhé. Cảm ơn quý khách đã sử dụng sản phẩm bên mình!';
        fulfillmentMessages.push({ text: { text: [responseText] } });
        cart = []; // Xóa giỏ hàng
        break;
      }

      case 'CungCapDiaChi': {
        // const address = req.body.queryResult.queryText; // Lấy toàn bộ nội dung khách nhập làm địa chỉ
        const responseText = 'Em đã nhận được thông tin. Đơn hàng sẽ được giao đến cho anh/chị trong thời gian sớm nhất. Cảm ơn quý khách đã sử dụng sản phẩm bên mình!';
        fulfillmentMessages.push({ text: { text: [responseText] } });
        cart = []; // Xóa giỏ hàng sau khi đã chốt đơn hoàn tất
        break;
      }

      default: {
        const responseText = `Webhook đang phát triển, đã nhận được intent: ${intentName}`;
        fulfillmentMessages.push({ text: { text: [responseText] } });
        break;
      }
    }

    const responseJson = {
      fulfillmentMessages: fulfillmentMessages,
      outputContexts: outputContexts,
      sessionInfo: { parameters: { cart: cart } },
    };
    res.status(200).send(responseJson);
  } catch (error) {
    console.error('LỖI WEBHOOK:', error);
    const errorResponse = {
      fulfillmentMessages: [{ text: { text: ['Oops! Có lỗi xảy ra ở phía đầu bếp. Vui lòng thử lại.'] } }]
    };
    res.status(200).send(errorResponse);
  }
});

module.exports = app;
