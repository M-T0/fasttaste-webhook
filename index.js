require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

// --- Hàm tiện ích ---
const buildTextMessage = (text) => ({ text: { text: [text] } });

const buildChipsMessage = (optionsArray) => ({
  payload: {
    richContent: [[{
      type: 'chips',
      options: optionsArray.map(text => ({ text }))
    }]]
  }
});

const buildContext = (session, name, lifespanCount = 2, parameters = {}) => ({
  name: `${session}/contexts/${name}`,
  lifespanCount,
  parameters
});

// --- Webhook xử lý yêu cầu từ Dialogflow ---
app.post('/api', async (req, res) => {
  try {
    const queryResult = req.body.queryResult ?? {};
    const intentName = queryResult.intent?.displayName ?? 'UnknownIntent';
    const session = req.body.session ?? 'UnknownSession';
    const parameters = queryResult.parameters ?? {};
    let cart = parameters.cart ?? [];
    let fulfillmentMessages = [];
    let outputContexts = [];

    switch (intentName) {
      // INTENT: chọn món hoặc thêm món
      case 'Xem Menu - chonmon':
      case 'muathem': {
        let newItems = parameters.mon_an || [];
        if (!Array.isArray(newItems)) newItems = [newItems];

        if (newItems.length > 0) {
          cart = cart.concat(newItems);
          const addedItemsText = newItems.join(', ');
          fulfillmentMessages.push(buildTextMessage(`✅ Đã thêm: ${addedItemsText}\n🧺 Giỏ hàng hiện tại: ${cart.join(', ')}`));
          fulfillmentMessages.push(buildChipsMessage(['Xem Gà Lẻ', 'Xem Món Ăn Kèm', 'Xem Nước Uống & Kem', 'Thanh toán']));
          outputContexts.push(buildContext(session, 'dang-chon-mon', 5, { cart }));
        } else {
          fulfillmentMessages.push(buildTextMessage('⚠️ Em chưa rõ món anh/chị muốn chọn ạ.'));
        }
        break;
      }

      // INTENT: thanh toán
      case 'Thanh-toan': {
        if (cart.length > 0) {
          const summary = cart.map(item => `• ${item}`).join('\n');
          fulfillmentMessages.push(buildTextMessage(`🧾 Em xác nhận đơn hàng:\n${summary}\n🚚 Chọn phương thức nhận hàng:`));
          fulfillmentMessages.push(buildChipsMessage(['Giao hàng tận nơi', 'Đến lấy tại cửa hàng']));
          outputContexts.push(buildContext(session, 'choosing-delivery-method', 2, { cart }));
        } else {
          fulfillmentMessages.push(buildTextMessage('🛒 Giỏ hàng của bạn đang trống. Vui lòng chọn món trước nhé.'));
        }
        break;
      }

      // INTENT: chọn giao hàng
      case 'ChonGiaoHang':
      case 'Chongiaohang': {
        const methodRaw = parameters['delivery-method'] ?? '';
        const method = methodRaw.toLowerCase().trim();

        if (method.includes('giao hàng')) {
          fulfillmentMessages.push(buildTextMessage('📦 Em cần địa chỉ và số điện thoại để giao hàng ạ.'));
          outputContexts.push(buildContext(session, 'awaiting-address', 2, { cart }));
        } else if (method.includes('đến lấy')) {
          fulfillmentMessages.push(buildTextMessage('🧾 Đơn hàng sẽ được chuẩn bị. Mời anh/chị đến FASTTASTE tại **7/1 Thành Thái, P.14, Q.10, TP.HCM** để nhận nhé!'));
        } else {
          fulfillmentMessages.push(buildTextMessage('⚠️ Vui lòng chọn "Giao hàng" hoặc "Đến lấy tại cửa hàng" giúp em nha.'));
        }
        break;
      }

      // INTENT: đến lấy tại cửa hàng
      case 'ChonDenLay': {
        fulfillmentMessages.push(buildTextMessage('🎁 Đơn hàng sẽ được chuẩn bị. Mời anh/chị đến FASTTASTE tại **7/1 Thành Thái, P.14, Q.10, TP.HCM** để nhận nhé. Cảm ơn quý khách!'));
        break;
      }

      // INTENT: cung cấp địa chỉ
      case 'CungCapDiaChi': {
        fulfillmentMessages.push(buildTextMessage('📬 Em đã nhận được thông tin. Đơn hàng sẽ được giao đến trong thời gian sớm nhất. Cảm ơn quý khách đã tin dùng sản phẩm bên em!'));
        break;
      }

      // INTENT chưa hỗ trợ
      default: {
        fulfillmentMessages.push(buildTextMessage(`❓ Em chưa được huấn luyện để xử lý intent: ${intentName} ạ.`));
        break;
      }
    }

    // Trả về kết quả cho Dialogflow
    res.status(200).send({ fulfillmentMessages, outputContexts });

  } catch (error) {
    console.error('[LỖI WEBHOOK]', error);
    res.status(200).send({
      fulfillmentMessages: [buildTextMessage('🔥 Có lỗi xảy ra ở phía đầu bếp. Vui lòng thử lại sau nhé!')]
    });
  }
});

module
