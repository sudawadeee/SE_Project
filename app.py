import torch
from torchvision import models, transforms
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# 1. ตั้งค่าตาม config.py
IMG_SIZE = 260
MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]
NUM_CLASSES = 22

# รายชื่อโรคภาษาอังกฤษและภาษาไทย
CLASS_NAMES = ["Acne", "Actinic_Keratosis", "Benign_tumors", "Bullous", "Candidiasis", "DrugEruption", "Eczema", "Infestations_Bites", "Lichen", "Lupus", "Moles", "Psoriasis", "Rosacea", "Seborrh_Keratoses", "SkinCancer", "Sun_Sunlight_Damage", "Tinea", "Unknown_Normal", "Vascular_Tumors", "Vasculitis", "Vitiligo", "Warts"]
CLASS_NAMES_TH = {"Acne": "สิว", "Actinic_Keratosis": "ผื่นแดดเรื้อรัง", "Benign_tumors": "เนื้องอกไม่ร้ายแรง", "Bullous": "โรคผื่นพุพอง", "Candidiasis": "โรคเชื้อราแคนดิดา", "DrugEruption": "ผื่นจากยา", "Eczema": "โรคผิวหนังอักเสบ", "Infestations_Bites": "โรคจากแมลงกัดต่อย", "Lichen": "ไลเคน", "Lupus": "โรคลูปัส", "Moles": "ไฝ", "Psoriasis": "โรคสะเก็ดเงิน", "Rosacea": "โรคโรซาเซีย", "Seborrh_Keratoses": "ไฝแก่", "SkinCancer": "มะเร็งผิวหนัง", "Sun_Sunlight_Damage": "ผิวเสียจากแสงแดด", "Tinea": "โรคกลาก", "Unknown_Normal": "ปกติ/ไม่ทราบ", "Vascular_Tumors": "เนื้องอกหลอดเลือด", "Vasculitis": "โรคหลอดเลือดอักเสบ", "Vitiligo": "โรคด่างขาว", "Warts": "หูด"}

# 2. โหลดโมเดล
model = models.efficientnet_b2()
model.classifier[1] = torch.nn.Linear(model.classifier[1].in_features, NUM_CLASSES)

# โหลด Checkpoint (ใช้ path ตามโครงสร้างโฟลเดอร์ในเครื่องคุณ)
checkpoint = torch.load('model/best_model.pth', map_location='cpu', weights_only=False)
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()

# 3. เตรียมจัดการรูปภาพตาม config
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(MEAN, STD)
])

@app.route('/api/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    
    file = request.files['file']
    img = Image.open(io.BytesIO(file.read())).convert('RGB')
    img_t = transform(img).unsqueeze(0)

    with torch.no_grad():
        outputs = model(img_t)
        prob = torch.nn.functional.softmax(outputs[0], dim=0)
        confidence, index = torch.max(prob, 0)

    en_name = CLASS_NAMES[index.item()]
    th_name = CLASS_NAMES_TH[en_name]

    return jsonify({
        "label": f"{en_name} ({th_name})",
        "confidence": round(confidence.item() * 100, 2)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)


# --- ส่วนที่เพิ่มเข้ามาใหม่ (จากโค้ด RAG ของเพื่อน) ---
from openai import OpenAI
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

# ตั้งค่า API ตามของเพื่อนคุณ
API_KEY = "sk_8BB2YyFppfr1z8Sk4mEfgc4AWLDTsjR4nXn2gsiUhAMdMWY1Jv1Yquin9EhSgf46"
BASE_URL = "https://gen.ai.kku.ac.th/api/v1"
MODEL_NAME = "gemini-3.1-pro-preview"

client_rag = OpenAI(api_key=API_KEY, base_url=BASE_URL)

# เตรียมข้อมูล Knowledge Base ของเพื่อน
documents = [
    "โรคผื่นภูมิแพ้ผิวหนัง (Atopic Dermatitis) มักมีอาการผิวแห้ง คันมาก และมีผื่นแดงตามข้อพับ",
    "โรคสะเก็ดเงิน (Psoriasis) เป็นโรคอุบัติซ้ำที่มีผื่นหนา ขอบชัด มีสะเก็ดสีเงิน มักพบบริเวณข้อศอกและหัวเข่า",
    "สิว (Acne Vulgaris) เกิดจากการอุดตันของรูขุมขนและความมันบนใบหน้า มีหลายประเภท ได้แก่ สิวอุดตัน สิวอักเสบ สิวไม่มีหัว",
    "การรักษาสิวเบื้องต้น: ยาทา Benzoyl Peroxide (BP) ช่วยฆ่าเชื้อแบคทีเรียและลดการอักเสบ, ยาทา Salicylic Acid (BHA) ช่วยผลัดเซลล์ผิวและสลายการอุดตัน",
    "การดูแลผิวเป็นสิว: ควรล้างหน้า 2 ครั้งต่อวันด้วยคลีนเซอร์สูตรอ่อนโยน ไม่ควรสครับหน้า หลีกเลี่ยงการบีบหรือแกะสิว"
    # ... คุณสามารถก๊อปปี้ documents ของเพื่อนมาใส่ให้ครบได้เลยครับ ...
]

# สร้าง Vector Database (รันครั้งเดียวตอนเริ่ม Server)
embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-m3")
vectorstore = Chroma.from_texts(texts=documents, embedding=embeddings)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_query = data.get('message')
    
    if not user_query:
        return jsonify({"reply": "กรุณาพิมพ์คำถามค่ะ"})

    # 1. ค้นหาข้อมูล (Retrieval)
    docs = vectorstore.similarity_search(user_query, k=4)
    context = "\n".join([f"- {d.page_content}" for d in docs])

    # 2. สร้าง Prompt
    system_prompt = f"""คุณคือผู้ช่วยอัจฉริยะด้านโรคผิวหนัง 
    จงตอบคำถามโดยอ้างอิงและใช้ข้อมูลใน "ข้อมูลอ้างอิง" เป็นหลัก
    ข้อมูลอ้างอิง:
    {context}
    """

    # 3. ส่งคำถามไปที่ chatbot
    response = client_rag.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query},
        ],
        temperature=0.1
    )
    
    return jsonify({"reply": response.choices[0].message.content})
