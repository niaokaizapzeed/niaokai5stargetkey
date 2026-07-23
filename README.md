# CHECKEN5STAR — แพลตฟอร์มแจกคีย์ (catalog + checkpoint/ads + หลังบ้าน)

ระบบใหม่: หน้าร้านแสดงสินค้า (คลิป YouTube + คำอธิบาย + ปุ่ม Get Key) →
กดแล้วไปหน้ารับคีย์ที่มีโฆษณา + checkpoint → รับคีย์ · ตั้งค่าทุกอย่างในหน้า **/admin**

## หน้าเว็บ
- `/` — หน้าหลัก: โลโก้+ชื่อ, แถบหมวดหมู่ (ทั้งหมด/IOS/ANDROID/PC), การ์ดสินค้า (คลิป+คำอธิบาย+ปุ่ม Get Key) · **ไม่มีโฆษณา**
- `/<slug>` — หน้ารับคีย์ของสินค้านั้น: **โฆษณา + checkpoint + จ่ายคีย์** (slug ตั้งในหลังบ้าน)
- `/login` — เข้าหลังบ้าน (เข้าผ่าน URL นี้เท่านั้น ไม่มีปุ่มบนเว็บ)
- `/admin` — จัดการ: ชื่อ/โลโก้เว็บ, หมวดหมู่, สินค้า (title, slug, คลิป, คำอธิบาย, หมวด, checkpoint, โฆษณาต่อสินค้า), สต็อกคีย์

## Deploy (Railway)
1. อัปขึ้น GitHub → Railway → Deploy from GitHub repo
2. ตั้ง Variables อย่างน้อย:
   - `SECRET_KEY` = สตริงสุ่มยาว ๆ (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `ADMIN_PASS` = รหัสผ่านแอดมิน (**ถ้าไม่ตั้ง จะ login หลังบ้านไม่ได้**)
   - `ADMIN_USER` = ชื่อผู้ใช้ (ไม่ตั้ง = `admin`)
   - `NODE_ENV` = `production`
3. (ถ้าใช้ Turnstile) `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`

### ⚠️ ต้องผูก Railway Volume ไม่งั้นข้อมูลหาย
ทุกอย่างที่แก้ในหลังบ้าน (สินค้า/หมวด/คีย์) เก็บเป็นไฟล์ `store.json` + `keys/` ในเครื่อง
ระบบไฟล์ Railway เป็นชั่วคราว → redeploy ทีไรข้อมูลรีเซ็ต **ต้องผูก Volume:**
1. Variables → เพิ่ม `DATA_DIR=/data`
2. Settings → Volumes → Mount ที่ `/data`

## การใช้งานหลังบ้าน
- เข้า `https://โดเมน/login` → ใส่ user/pass (จาก env) → เข้าหน้า /admin
- **ตั้งค่าเว็บ**: ชื่อ + URL โลโก้
- **หมวดหมู่**: เพิ่ม/ลบ/แก้ชื่อ
- **สินค้า**: เพิ่ม/แก้/ลบ — กรอก title, slug (url), ลิงก์ YouTube, คำอธิบาย, หมวดหมู่, จำนวน checkpoint, เวลารอ/ด่าน และ **ค่าโฆษณา Adsterra ต่อสินค้า** (Direct Link, Social Bar, Popunder, Native Banner)
- **คีย์**: ปุ่ม "คีย์" ที่สินค้า → วางคีย์ 1 บรรทัด/ตัว → บันทึก (ระบบตัดคีย์ที่จ่ายไปแล้วออกเอง)

## ความปลอดภัย (เหมือนเดิม + ต่อสินค้า)
- คีย์อยู่ฝั่งเซิร์ฟเวอร์ จ่ายผ่าน token เซ็น HMAC · ข้ามด่านไม่ได้ · กันบอท (rate limit, honeypot, Turnstile)
- session 10 นาที (เกินหรือออกจากเว็บ → เริ่มใหม่) · /<slug> รับคีย์แล้วครั้งเดียว (รีเฟรช → เริ่มใหม่)
- โฆษณายิงใหม่ทุก checkpoint (หน้ารีโหลดแต่ละด่าน) · หน้าหลักไม่มีโฆษณา
- แอดมิน login แยก cookie เซ็น HMAC หมดอายุตาม `ADMIN_TTL`

## env สรุป
`SECRET_KEY` `ADMIN_USER` `ADMIN_PASS` `NODE_ENV` `SESSION_TTL`(600) `TOKEN_TTL`(3600) `ADMIN_TTL`(86400) `TURNSTILE_SITE_KEY` `TURNSTILE_SECRET_KEY` `DATA_DIR`
