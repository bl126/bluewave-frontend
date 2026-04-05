import json
import os

translations_dir = r"c:\Users\HP\Desktop\bluewave-fullstack\bluewave-frontend\translations"

# We removed EcosystemTour entirely, so those keys aren't strictly necessary, 
# but we will provide accurate translations for ghost and alerts.

lang_data = {
    "es": {
        "ghost": {
            "sector_encrypted": "Sector Encriptado",
            "connect_prompt": "Conecta tu billetera TON para descifrar el ecosistema de recompensas y activar tu BW ID.",
            "connect_btn": "Conectar Billetera TON"
        },
        "alerts": {
            "connect_wallet_ref": "Por favor, conecta tu billetera para generar un enlace de referido.",
            "connect_wallet_blu": "Por favor, conecta tu billetera para acceder a las configuraciones de Blu."
        }
    },
    "ru": {
        "ghost": {
            "sector_encrypted": "Сектор Зашифрован",
            "connect_prompt": "Подключите кошелек TON, чтобы расшифровать экосистему наград и активировать ваш BW ID.",
            "connect_btn": "Подключить кошелек TON"
        },
        "alerts": {
            "connect_wallet_ref": "Пожалуйста, подключите кошелек, чтобы сгенерировать реферальную ссылку.",
            "connect_wallet_blu": "Пожалуйста, подключите кошелек для доступа к настройкам Blu."
        }
    },
    "zh": {
        "ghost": {
            "sector_encrypted": "扇区已加密",
            "connect_prompt": "连接您的 TON 钱包以解密奖励生态系统并激活您的 BW ID。",
            "connect_btn": "连接 TON 钱包"
        },
        "alerts": {
            "connect_wallet_ref": "请连接您的钱包以生成推荐链接。",
            "connect_wallet_blu": "请连接您的钱包以访问 Blu 配置。"
        }
    },
    "pt": {
        "ghost": {
            "sector_encrypted": "Setor Encriptado",
            "connect_prompt": "Conecte sua carteira TON para descriptografar o ecossistema de recompensas e ativar seu BW ID.",
            "connect_btn": "Conectar Carteira TON"
        },
        "alerts": {
            "connect_wallet_ref": "Por favor, conecte sua carteira para gerar um link de referência.",
            "connect_wallet_blu": "Por favor, conecte sua carteira para acessar as configurações do Blu."
        }
    },
    "id": {
        "ghost": {
            "sector_encrypted": "Sektor Terenkripsi",
            "connect_prompt": "Hubungkan dompet TON Anda untuk mendekripsi ekosistem hadiah dan mengaktifkan BW ID Anda.",
            "connect_btn": "Hubungkan Dompet TON"
        },
        "alerts": {
            "connect_wallet_ref": "Silakan hubungkan dompet Anda untuk membuat tautan rujukan.",
            "connect_wallet_blu": "Silakan hubungkan dompet Anda untuk mengakses konfigurasi Blu."
        }
    },
    "hi": {
        "ghost": {
            "sector_encrypted": "अनुभाग एन्क्रिप्टेड (Sector Encrypted)",
            "connect_prompt": "रिवॉर्ड इकोसिस्टम को डिक्रिप्ट करने और अपना BW ID सक्रिय करने के लिए अपना TON वॉलेट कनेक्ट करें।",
            "connect_btn": "TON वॉलेट कनेक्ट करें"
        },
        "alerts": {
            "connect_wallet_ref": "रेफरल लिंक बनाने के लिए कृपया अपना वॉलेट कनेक्ट करें।",
            "connect_wallet_blu": "Blu कॉन्फ़िगरेशन एक्सेस करने के लिए कृपया अपना वॉलेट कनेक्ट करें।"
        }
    },
    "th": {
        "ghost": {
            "sector_encrypted": "เซกเตอร์ถูกเข้ารหัส",
            "connect_prompt": "เชื่อมต่อกระเป๋าเงิน TON ของคุณเพื่อถอดรหัสระบบนิเวศผลตอบแทนและเปิดใช้งาน BW ID ของคุณ",
            "connect_btn": "เชื่อมต่อกระเป๋าเงิน TON"
        },
        "alerts": {
            "connect_wallet_ref": "โปรดเชื่อมต่อกระเป๋าเงินของคุณเพื่อรับลิงก์อ้างอิง",
            "connect_wallet_blu": "โปรดเชื่อมต่อกระเป๋าเงินของคุณเพื่อเข้าถึงการตั้งค่า Blu"
        }
    }
}

for lang_code, translations in lang_data.items():
    filepath = os.path.join(translations_dir, f"{lang_code}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Overwrite the english fallbacks with actual translations
        data["ghost"] = translations["ghost"]
        data["alerts"] = translations["alerts"]

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

print("Actual language translations for lockscreens successfully updated.")
