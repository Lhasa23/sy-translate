import * as querystring from 'querystring'
import * as https from 'https'
import uuid = require('node-uuid')

import * as crypto from 'crypto'

const sha256 = crypto.createHash('sha256')
const baseUrl = 'openapi.youdao.com'
export const translate = (word: string) => {
	const salt = uuid.v4()

	// input=q前10个字符 + q长度 + q后10个字符（当q长度大于20）或 input=q字符串（当q长度小于等于20）
	const input = word.length > 20
		? `${word.substring(0, 10)}${word.length}${word.substring(word.length - 10, word.length)}`
		: word

	//当前UTC时间戳(秒)
	const curtime = Math.round(new Date().getTime() / 1000)

	// (应用ID+input+salt+curtime+应用密钥)
	const signProto = `78b6b8691b3c1882${input}${salt}${curtime}Et24MOlyZiIydGIXjvAQ3WpF2jpAoC2M`
	sha256.update(signProto)
	const sign = sha256.digest('hex')

	const postData = querystring.stringify({
		q: word, //	text	待翻译文本	True	必须是UTF-8编码
		from: 'auto', //	text	源语言	True	参考下方 支持语言 (可设置为auto)
		to: 'auto', //	text	目标语言	True	参考下方 支持语言 (可设置为auto)
		appKey: '78b6b8691b3c1882', //应用ID
		salt, //UUID
		sign, //签名 sha256(应用ID+input+salt+curtime+应用密钥)
		signType: 'v3', //签名类型 v3
		curtime,
		strict: false // 是否严格按照指定from和to进行翻译：true/false如果为false，则会自动中译英，英译中
	})

	const options = {
		hostname: baseUrl,
		port: 443,
		path: `/api?${postData}`,
		method: 'GET'
	}

	const req = https.request(options, (res) => {
		let chunks: Buffer[] = []
		res.on('data', (chunk) => {
			chunks.push(chunk)
		})
		res.on('end', () => {
			const string = Buffer.concat(chunks).toString()
			const response = JSON.parse(string)
			console.log(response.basic.explains.join('\n'))
		})
	})

	req.on('error', (e) => {
		console.error(e)
	})
	req.end()
}
