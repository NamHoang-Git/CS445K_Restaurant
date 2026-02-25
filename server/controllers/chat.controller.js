import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_FALLBACK_CHAIN = [
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
];

const SYSTEM_PROMPT = `Bạn là trợ lý AI của TechCommerce — một cửa hàng thương mại điện tử chuyên bán các sản phẩm công nghệ như điện thoại, laptop, tablet, phụ kiện và thiết bị điện tử.

Nhiệm vụ của bạn:
- Giải đáp thắc mắc về sản phẩm, giá cả, tình trạng hàng hóa
- Hỗ trợ khách hàng về quy trình đặt hàng, thanh toán (COD, Stripe/thẻ)
- Thông tin về chính sách đổi trả, bảo hành (7 ngày đổi trả, 12 tháng bảo hành)
- Hỗ trợ theo dõi đơn hàng (hướng dẫn xem trong mục "Đơn hàng của tôi")
- Giới thiệu voucher/mã giảm giá hiện có
- Hỗ trợ tạo tài khoản, đăng nhập

Nguyên tắc trả lời:
- Luôn trả lời bằng tiếng Việt, thân thiện và ngắn gọn
- Nếu không biết thông tin cụ thể (ví dụ giá sản phẩm thực tế), hãy hướng dẫn khách tìm kiếm trên trang
- Không bịa đặt thông tin về giá cả hay tồn kho cụ thể
- Khi cần hỗ trợ nâng cao, gợi ý liên hệ qua email: support@techcommerce.vn`;

// ─── Local FAQ — trả lời ngay không tốn quota ──────────────────────────────
const FAQ = [
    {
        keywords: ["bán", "sản phẩm", "gì", "danh mục", "có những"],
        answer: "TechCommerce chuyên bán các sản phẩm công nghệ: 📱 Điện thoại, 💻 Laptop, 🎧 Phụ kiện, ⌚ Đồng hồ thông minh, và nhiều thiết bị điện tử khác. Bạn có thể xem toàn bộ danh mục trên trang chủ!"
    },
    {
        keywords: ["đổi trả", "hoàn tiền", "bảo hành", "trả hàng"],
        answer: "Chính sách của TechCommerce:\n• ✅ Đổi trả trong **7 ngày** nếu lỗi nhà sản xuất\n• 🔧 Bảo hành **12 tháng** cho tất cả sản phẩm\n• 💰 Hoàn tiền 100% nếu sản phẩm lỗi không thể sửa\n\nLiên hệ support@techcommerce.vn để được hỗ trợ đổi trả!"
    },
    {
        keywords: ["đặt hàng", "mua", "cách mua", "thanh toán", "order"],
        answer: "Cách đặt hàng tại TechCommerce:\n1. 🔍 Tìm sản phẩm và thêm vào giỏ hàng\n2. 🛒 Vào giỏ hàng → Tiến hành thanh toán\n3. 📍 Nhập địa chỉ giao hàng\n4. 💳 Chọn thanh toán: **COD** (tiền mặt) hoặc **Thẻ/Stripe**\n5. ✅ Xác nhận đơn hàng!"
    },
    {
        keywords: ["voucher", "mã giảm giá", "khuyến mãi", "coupon", "discount"],
        answer: "TechCommerce có các voucher giảm giá hấp dẫn! 🎁\nBạn có thể xem và áp dụng voucher tại bước thanh toán. Đăng ký tài khoản để nhận voucher chào mừng và các ưu đãi thành viên!"
    },
    {
        keywords: ["đơn hàng", "theo dõi", "vận chuyển", "giao hàng", "ship"],
        answer: "Để theo dõi đơn hàng:\n📦 Vào **Tài khoản → Đơn hàng của tôi** để xem trạng thái đơn hàng.\n\nThời gian giao hàng thường từ 2-5 ngày làm việc tùy khu vực."
    },
    {
        keywords: ["tài khoản", "đăng ký", "đăng nhập", "mật khẩu", "profile"],
        answer: "Bạn có thể:\n• **Đăng ký** tài khoản mới tại trang Đăng ký\n• **Đăng nhập** bằng email/mật khẩu hoặc Google\n• **Quên mật khẩu** → dùng chức năng 'Quên mật khẩu' để reset qua email"
    },
    {
        keywords: ["liên hệ", "hỗ trợ", "contact", "hotline", "email"],
        answer: "Liên hệ TechCommerce:\n📧 Email: support@techcommerce.vn\n⏰ Hỗ trợ 8:00 - 22:00 hàng ngày\n\nHoặc chat trực tiếp với tôi — tôi luôn sẵn sàng giúp bạn! 😊"
    },
];

function checkFAQ(message) {
    const lower = message.toLowerCase();
    for (const item of FAQ) {
        const matched = item.keywords.filter(kw => lower.includes(kw));
        if (matched.length >= 1) return item.answer;
    }
    return null;
}

// ─── Server-side rate limiter (per IP) ─────────────────────────────────────
const ipLastRequest = new Map();
const RATE_LIMIT_MS = 4000; // tối thiểu 4 giây giữa 2 request AI cùng 1 IP

// ─── Gemini fallback chain ──────────────────────────────────────────────────
const SKIP_STATUSES = new Set([429, 404, 503]);

async function sendWithModelFallback(message, formattedHistory) {
    let lastError;
    for (const modelName of MODEL_FALLBACK_CHAIN) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: SYSTEM_PROMPT,
            });
            const chat = model.startChat({ history: formattedHistory });
            const result = await chat.sendMessage(message);
            console.log(`[Chat] Served by: ${modelName}`);
            return result.response.text();
        } catch (error) {
            lastError = error;
            if (SKIP_STATUSES.has(error.status)) {
                console.warn(`[Chat] Model ${modelName} unavailable (${error.status}), trying next...`);
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

// ─── Controller ─────────────────────────────────────────────────────────────
export async function chatController(req, res) {
    try {
        const { message, history = [] } = req.body;

        if (!message || typeof message !== "string" || message.trim() === "") {
            return res.status(400).json({
                message: "Tin nhắn không được để trống",
                error: true,
                success: false,
            });
        }

        const text = message.trim();

        // 1. Thử trả lời từ FAQ local trước (không tốn quota)
        const faqAnswer = checkFAQ(text);
        if (faqAnswer) {
            console.log("[Chat] Served by: local FAQ");
            return res.json({
                message: "Thành công",
                error: false,
                success: true,
                data: { reply: faqAnswer },
            });
        }

        // 2. Rate limit per IP — tránh spam Gemini API
        const ip = req.ip || req.socket?.remoteAddress || "unknown";
        const now = Date.now();
        const lastTime = ipLastRequest.get(ip) || 0;
        const elapsed = now - lastTime;
        if (elapsed < RATE_LIMIT_MS) {
            const waitSec = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
            return res.status(429).json({
                message: `Vui lòng chờ ${waitSec} giây trước khi gửi tin tiếp theo ⏳`,
                error: true,
                success: false,
            });
        }
        ipLastRequest.set(ip, now);

        // 3. Gọi Gemini với fallback chain
        const formattedHistory = history
            .filter((msg) => msg.role && msg.text)
            .map((msg) => ({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.text }],
            }));

        const responseText = await sendWithModelFallback(text, formattedHistory);

        return res.json({
            message: "Thành công",
            error: false,
            success: true,
            data: { reply: responseText },
        });
    } catch (error) {
        console.error("[Chat] AI error:", error.status, error.statusText);

        if (error.status === 429) {
            return res.status(429).json({
                message: "AI đang bận, vui lòng thử lại sau vài phút! ⏳",
                error: true,
                success: false,
            });
        }

        return res.status(500).json({
            message: "Lỗi kết nối AI. Vui lòng thử lại sau.",
            error: true,
            success: false,
        });
    }
}