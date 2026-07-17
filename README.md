# 梁山福铺·知福先生 Agent

这是一个可放在西溪湿地文创摊位现场运行的语音互动网页应用。游客可以：

1. 和“知福先生”进行中文语音或文字对话。
2. 在自然对话中随机体验数字、颜色、方位或西溪景物等民俗娱乐小术，也可能只进行轻松聊天。
3. 根据“为谁问、想要什么祝福、喜欢怎样的体验”获得一个明确商品推荐。
4. 推荐结果只会是以下一种，不会同时推多个产品：
   - 某位人物的成品香囊。
   - 某位人物的 DIY 香囊。
   - 水浒随机福袋。
   - 某位人物主题水浒头巾。

当前四位人物：

- 鲁智深：拔掉烦恼。
- 李逵：快乐加倍。
- 张顺：顺风顺水。
- 安道全：安到全家。

## 一、当前完成情况

- React 全屏现场交互界面。
- Express 本地服务端，API key 不会发送到游客浏览器。
- OpenAI 风格文本模型接口。
- OpenAI 风格语音识别和语音合成接口。
- 浏览器语音听写和系统朗读降级方案。
- 模型不可用时的本地规则推荐。
- 随会话随机融入的 1089、数字、颜色、方位和西溪景物小术。
- 对话结束后的吉利好运判词、商品图片与单品推荐理由。
- 桌面和手机响应式布局。
- 算命先生主视觉、四张水浒人物图与三类商品展示图已内置。

## 二、快速运行

### 1. 安装依赖

在本文件夹打开 PowerShell：

```powershell
npm.cmd install --cache .npm-cache
```

### 2. 先用演示模式运行

```powershell
npm.cmd run build
npm.cmd start
```

浏览器打开：

```text
http://localhost:8787
```

演示模式不需要大模型 API。它会用本地关键词和选择规则完成对话与商品推荐。

### 3. 开发模式

```powershell
npm.cmd run dev
```

开发界面地址：

```text
http://localhost:5173
```

## 三、接入你的大语言模型

复制 `.env.example` 为 `.env`，填写以下字段：

```dotenv
MOCK_MODE=false
LLM_BASE_URL=https://api.deepseek.com
LLM_API_KEY=你的密钥
LLM_MODEL=deepseek-v4-pro
LLM_FALLBACK_MODELS=deepseek-v4-flash
LLM_CHAT_PATH=/chat/completions
LLM_MAX_TOKENS=2200
LLM_TIMEOUT_MS=22000
LLM_FALLBACK_TIMEOUT_MS=12000
```

该配置实际请求 `https://api.deepseek.com/chat/completions`。DeepSeek 的 Base URL 不要求末尾带 `/v1`；本项目以 `deepseek-v4-pro` 作为稳定主模型，若主模型超时会立即切换到响应更快的 `deepseek-v4-flash`。若 V4 偶发返回“推理完成但正文为空”，会快速补试一次；仍不可用时由同一套长对话本地规则无缝接话，下一轮继续尝试 API，游客界面不会弹出技术错误。

当前服务端默认兼容以下请求格式：

```http
POST {LLM_BASE_URL}{LLM_CHAT_PATH}
Authorization: Bearer YOUR_KEY
Content-Type: application/json
```

请求体使用：

```json
{
  "model": "deepseek-v4-pro",
  "temperature": 0.75,
  "max_tokens": 2200,
  "response_format": { "type": "json_object" },
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ]
}
```

预期响应内容在：

```text
choices[0].message.content
```

模型需支持中文，并能按提示输出 JSON。如果你的接口不是这种格式，需要调整 `server/providers.mjs` 中的 `callChatModel()`。

## 四、语音聊天需要什么

语音聊天由两个独立环节构成：

```text
游客语音 -> STT 语音识别 -> 文本模型 -> TTS 语音合成 -> 扬声器播放
```

### 方案 A：零额外 API

默认配置：

```dotenv
STT_PROVIDER=browser
TTS_PROVIDER=browser
```

效果：

- 语音输入使用 Edge/Chrome 的浏览器语音识别。
- 语音输出使用 Windows/浏览器的中文系统声音。
- 不需要另外提供语音 API key。

限制：

- Chrome/Edge 的语音识别通常仍依赖网络，不应理解为完全离线。
- 户外噪声较大时，识别准确率可能下降。
- 不同电脑上的中文系统音色不同。
- 浏览器首次使用时必须允许麦克风权限。

这个方案适合先现场试运行，但正式摆摊更建议使用方案 B。

### 方案 B：接入语音 API

如果你的供应商同时支持 OpenAI 风格语音接口，可以填写：

```dotenv
STT_PROVIDER=openai-compatible
STT_BASE_URL=https://语音接口地址/v1
STT_API_KEY=语音接口密钥
STT_MODEL=whisper-1
STT_PATH=/audio/transcriptions

TTS_PROVIDER=openai-compatible
TTS_BASE_URL=https://语音接口地址/v1
TTS_API_KEY=语音接口密钥
TTS_MODEL=gpt-4o-mini-tts
TTS_VOICE=alloy
TTS_PATH=/audio/speech
```

文本模型、STT 和 TTS 可以来自三个不同供应商，URL 和 key 可以分别填写。

语音识别接口预期：

```http
POST /audio/transcriptions
Content-Type: multipart/form-data

file=<audio/webm>
model=<STT_MODEL>
language=zh
```

预期返回：

```json
{ "text": "识别出的中文" }
```

语音合成接口预期：

```http
POST /audio/speech
Content-Type: application/json
```

```json
{
  "model": "your-tts-model",
  "voice": "your-voice",
  "input": "需要朗读的中文",
  "response_format": "mp3"
}
```

预期直接返回音频二进制。如果供应商格式不同，需要调整 `server/providers.mjs` 中的 `transcribeAudio()` 或 `synthesizeSpeech()`。

## 五、建议你提供的接口信息

要把真实服务接好，请提供：

1. 文本模型 Base URL。
2. 文本模型 API key。
3. 文本模型名称。
4. 一份可用的 curl 或请求示例。
5. 文本模型是否兼容 `/chat/completions`。
6. 是否同时提供语音识别接口。
7. 是否同时提供语音合成接口，以及有哪些中文音色。
8. 三个接口的速率限制和单次最大音频长度。

密钥不要写进聊天截图、前端代码或 `src/`。只填在本机 `.env` 中。

## 六、推荐的现场硬件

最低配置：

- 一台 Windows 笔记本电脑。
- Edge 或 Chrome。
- 电脑自带麦克风和扬声器。
- 稳定电源。

正式现场建议增加：

- 一个有线或 USB 指向性麦克风，优先于远场收音。
- 一个小型有源音箱，音量只需让当前游客听清。
- 4G/5G 手机热点作为景区网络备份。
- 鼠标或触摸屏，方便中老年游客点击大按钮。
- 一名工作人员在旁协助和接住最终推荐。

不建议让多个游客同时对着一支麦克风讲话。一次服务一组同行游客，准确率和体验都会更好。

## 七、文件结构

```text
算命先生Agent/
├─ garden-gpt-image-2/      界面概念图和 GPT Image 2 提示词
├─ docs/                    接口、对话和现场运营说明
├─ public/assets/           人物、算命先生和商品图片
├─ server/                  本地服务端、模型与语音代理
├─ src/                     React 前端
├─ .env.example             配置模板
├─ package.json
└─ README.md
```

## 八、关键代码位置

- 商品定义与推荐名称：`server/catalog.mjs`
- 大模型角色和安全提示词：`server/prompt.mjs`
- 无模型时的本地推荐：`server/mock-agent.mjs`
- 文本、STT、TTS 接口适配：`server/providers.mjs`
- 服务端路由：`server/index.mjs`
- 主界面状态：`src/App.jsx`
- 对话内随机小术与江湖商人人设：`server/prompt.mjs`
- 语音输入输出：`src/hooks/useVoice.js`

## 九、上线前检查

- [ ] `.env` 已配置且没有展示给游客。
- [ ] `MOCK_MODE=false` 后真实模型能返回推荐。
- [ ] 麦克风权限已允许。
- [ ] 现场网络和备用热点均测试过。
- [ ] 算命先生主视觉和三张商品图正常加载。
- [ ] 扬声器音量不会影响周围游客。
- [ ] 模型输出不会承诺疾病、财运、考试或命运结果。
- [ ] 每次最终只出现一个商品。
- [ ] 工作人员知道如何按“重新开始”清空上一位游客的对话。
- [ ] 断网时将 `MOCK_MODE=true`，本地推荐仍可工作。

## 十、火山引擎一键配置

如果使用同一个火山应用中开通的“语音合成 2.0”和“录音文件识别 1.0”：

1. 双击 `配置火山语音.cmd`。
2. 输入应用的 App ID。
3. 输入语音应用页面生成的 API Key；不要使用账号通用 Access Key，输入过程不会显示字符。
4. 双击 `测试火山语音.cmd`，脚本会分别测试庄周 2.0 合成和录音文件识别。
5. 双击 `启动现场版.cmd`，在网页中点击麦克风测试真实录音识别。

向导会固定使用：

```text
zh_male_zhuangzhou_uranus_bigtts
```

真实密钥只写入被 Git 忽略的 `.env`，不会进入源码或 GitHub。

如果 TTS 成功但 ASR 提示 `vc.async.default` 未授权，说明两项服务不能复用当前 Key。请在“录音文件识别 1.0”的“API 接入/调用示例”中复制其专用 API Key 到 `VOLCENGINE_ASR_API_KEY`；如果该页面显示的是 Access Token，则写入 `VOLCENGINE_ACCESS_TOKEN`，并保持 `VOLCENGINE_ASR_API_KEY` 为空。
