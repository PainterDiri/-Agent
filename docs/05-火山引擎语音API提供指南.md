# 火山引擎语音 API 提供指南

本文说明如何在不泄露密钥的情况下，把火山引擎语音识别和语音合成配置交给本项目使用。

## 一、你最终需要准备什么

至少需要两项服务：

1. **ASR / STT**：把游客语音转换为中文文字。
2. **TTS**：把“四福先生”的文字回复转换为声音。

火山引擎不同语音产品、不同版本的控制台可能展示两套凭证形式：

### 新版常见形式

- App ID / App Key。
- Access Key 或 Access Token。
- Resource ID。
- 服务 Endpoint。
- TTS 的音色或 `voice_type`。

### 旧版常见形式

- App ID。
- Token。
- Cluster。
- Endpoint。
- TTS 的 `voice_type`。

必须以你在火山引擎控制台“调用示例”中看到的字段为准，不要把新版 Access Key 和旧版 Cluster 混在同一个请求里。

## 二、开通路径

### 1. 登录火山引擎

打开：

<https://console.volcengine.com/>

使用完成实名认证的火山引擎账号登录。

### 2. 进入语音技术

产品入口：

<https://www.volcengine.com/product/voice-tech>

在控制台搜索以下关键词之一：

- 语音技术
- 语音识别
- 大模型语音识别
- 语音合成
- 豆包语音

### 3. 创建语音应用

建议应用名称：

```text
西溪四福局语音Agent
```

创建后保存控制台展示的 `App ID`。如果 ASR 与 TTS 可以挂在同一个应用下，优先使用同一个应用，方便额度和日志管理。

## 三、ASR 应该选哪一种

### 第一阶段推荐：短音频或录音文件识别

当前网页工作方式是：

```text
游客点击麦克风 -> 说完后再次点击 -> 浏览器上传一小段 WebM -> 服务端识别
```

因此第一阶段应优先选择支持短音频上传、录音文件识别或一句话识别的接口。开发改动较小，也更容易排查。

要求：

- 支持普通话。
- 单段音频 3—20 秒。
- 能接收 WebM/Opus，或允许服务端转为 WAV/PCM。
- 返回完整文本。
- 最好支持热词或上下文词表。

建议添加的热词：

```text
西溪
水浒
鲁智深
李逵
张顺
安道全
拔掉烦恼
快乐加倍
顺风顺水
安到全家
香囊
福袋
```

### 第二阶段可选：大模型流式语音识别

如果希望游客说话时屏幕实时出现字幕，再开通 WebSocket 流式 ASR。

流式识别体验更自然，但需要修改前端：

- 麦克风数据按小块持续发送。
- 页面显示临时识别文本。
- 用户停顿后提交最终文本给 LLM。
- 处理断线重连和中间结果覆盖。

正式摆摊前不建议同时首次接入流式 ASR、TTS 和大模型对话，应先把短音频闭环跑稳。

## 四、TTS 应该选择什么

选择支持中文、音色选择或声音设计的语音合成服务。

需要在控制台记录：

- 接口 Endpoint。
- Resource ID 或 Cluster。
- 模型或服务版本。
- 选中的 `voice_type` / speaker ID。
- 支持的音频格式。
- 是否支持语速、音高、情绪或风格参数。

### 算命先生音色标准

建议音色：

- 男声。
- 年龄感约 45—60 岁。
- 中低音。
- 普通话清晰。
- 稍慢但不拖沓。
- 温和、从容、有一点说书感。
- 不要阴森、沙哑过度或神神叨叨。

推荐试听文案：

> 客官请坐。今日想为自己、孩子、父母，还是全家问一份好彩头？

> 一百单八将，前来点福。先生为你点定：张顺，顺风顺水随机福袋。

> 小客官今天点到李逵，快乐加倍。和家里人亲手做一只香囊，把共同完成的快乐带回家。

试听时重点检查“李逵”“安道全”“西溪”等专名是否自然。

## 五、不要把真实密钥发到聊天里

最安全的提供方式是：**你在自己电脑的 `.env` 中填写真实值，我只检测字段是否存在并发起测试。**

项目中的 `.env` 已被 `.gitignore` 忽略，不会上传 GitHub。

打开：

```text
E:\Code\学习相关\社会创新设计\算命先生Agent\.env
```

在文件末尾加入：

```dotenv
# Volcengine Speech
VOLCENGINE_APP_ID=
VOLCENGINE_ACCESS_KEY=
VOLCENGINE_ACCESS_TOKEN=
VOLCENGINE_ASR_RESOURCE_ID=
VOLCENGINE_TTS_RESOURCE_ID=
VOLCENGINE_ASR_ENDPOINT=
VOLCENGINE_TTS_ENDPOINT=
VOLCENGINE_TTS_VOICE_TYPE=
VOLCENGINE_CLUSTER=
```

你只填写控制台实际提供的字段。没有显示的字段留空。

## 六、哪些信息可以直接发给我

以下信息通常不属于密钥，可以在聊天中提供：

1. 你开通的 ASR 产品完整名称。
2. 你开通的 TTS 产品完整名称。
3. 官方文档链接。
4. 官方调用示例，但必须把 Access Key、Token、Authorization 内容替换为 `***`。
5. ASR Endpoint。
6. TTS Endpoint。
7. Resource ID 或 Cluster 名称。
8. 选中的 `voice_type` / speaker ID。
9. 希望返回 MP3、WAV 还是 PCM。
10. 是否需要实时字幕。

以下信息不要在聊天中提供：

- Access Key。
- Secret Key。
- Access Token。
- Bearer Token。
- 完整 Authorization 请求头。
- 包含真实签名的 curl 命令。

## 七、最理想的提供格式

填写 `.env` 后，在聊天中只回复下面这些非敏感信息：

```text
ASR 产品：
ASR 官方文档：
ASR Endpoint：
ASR Resource ID / Cluster：

TTS 产品：
TTS 官方文档：
TTS Endpoint：
TTS Resource ID / Cluster：
TTS voice_type：
输出格式：MP3 / WAV / PCM

是否需要实时字幕：是 / 否
.env 已填写：是
```

收到这些信息后，我可以直接完成：

1. 在 `server/providers.mjs` 中增加火山引擎适配器。
2. 配置请求头、签名和 Resource ID。
3. 必要时调用 FFmpeg 将 WebM 转为接口需要的格式。
4. 测试普通话识别和十个水浒热词。
5. 测试 TTS 音色、语速和首包延迟。
6. 让语音服务失败时自动退回浏览器语音。

## 八、建议的第一版配置

为了最快跑通：

- ASR：短音频/录音识别，不做实时字幕。
- TTS：选择一个现成中低音男声，不先做声音克隆。
- 输出：MP3，浏览器播放最方便。
- 单轮回复：控制在 70 个汉字以内。
- 音频：游客说完后再提交。
- 超时：ASR 和 TTS 各 15 秒，失败即降级。

第一版稳定后，再增加：

- WebSocket 实时识别。
- 自定义热词。
- 声音复刻或声音设计。
- 流式 TTS，缩短首句等待。

## 九、安全与授权

- 如果使用声音克隆，必须获得被克隆者明确授权。
- 确认音色允许商业现场使用。
- 查清游客录音是否保存、保存多久、是否用于训练。
- 不上传儿童姓名、学校、住址等信息。
- 活动结束后可轮换或撤销临时 Access Key。
- 为语音应用设置额度告警，避免密钥泄漏产生异常费用。

