package internal

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"encoding/hex"
	"encoding/json"
	"log"
)

type Encryption struct {
	config struct {
		algorithm   string
		initVector  string
		securityKey string
	}
}

func PKCS5UnPadding(origData []byte) []byte {
	length := len(origData)
	unpadding := int(origData[length-1])
	return origData[:(length - unpadding)]
}

func (e *Encryption) SetConfig(config map[string]string) *Encryption {
	e.config.algorithm = config["algorithm"]
	e.config.initVector = config["initVector"]
	e.config.securityKey = config["securityKey"]

	return e
}

func (e *Encryption) Decrypt(data string) string {
	block, err := aes.NewCipher([]byte(e.config.securityKey))
	if err != nil {
		log.Fatalf("Failed to create cipher: %s", err)
	}

	ciphertext, _ := hex.DecodeString(data)
	if len(ciphertext) < aes.BlockSize {
		log.Fatal("ciphertext too short")
	}

	mode := cipher.NewCBCDecrypter(block, []byte(e.config.initVector))
	mode.CryptBlocks(ciphertext, ciphertext)

	plaintext := string(PKCS5UnPadding(ciphertext))

	var result map[string]interface{}
	err = json.Unmarshal([]byte(plaintext), &result)
	if err != nil {
		log.Fatalf("Failed to unmarshal data: %s", err)
	}

	return result["data"].(string)
}

// PKCS5Padding adds PKCS#5 padding to the data.
func PKCS5Padding(ciphertext []byte, blockSize int) []byte {
	padding := blockSize - len(ciphertext)%blockSize
	padtext := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(ciphertext, padtext...)
}

func (e *Encryption) Encrypt(data string) string {
	plaintext, err := json.Marshal(map[string]interface{}{
		"data": data,
	})

	if err != nil {
		log.Fatalf("Failed to marshal data: %s", err)

		return ""
	}

	block, err := aes.NewCipher([]byte(e.config.securityKey))
	if err != nil {
		log.Fatalf("Failed to create cipher: %s", err)
	}

	blockSize := block.BlockSize()
	plaintext = PKCS5Padding(plaintext, blockSize)

	ciphertext := make([]byte, len(plaintext))
	mode := cipher.NewCBCEncrypter(block, []byte(e.config.initVector))
	mode.CryptBlocks(ciphertext, plaintext)

	encodedCiphertext := hex.EncodeToString(ciphertext)

	return encodedCiphertext
}

func (e *Encryption) CompleteDecryption(data map[string]interface{}) map[string]interface{} {
    for key, value := range data {
        if value != nil {
            switch v := value.(type) {
            case string:
                data[key] = e.Decrypt(v)
            case map[string]interface{}:
                data[key] = e.CompleteDecryption(v)
            case []interface{}:
                for i, item := range v {
                    if item != nil {
                        switch itemValue := item.(type) {
                        case string:
                            data[key].([]interface{})[i] = e.Decrypt(itemValue)
                        case map[string]interface{}:
                            data[key].([]interface{})[i] = e.CompleteDecryption(itemValue)
                        }
                    }
                }
            }
        }
    }

    return data
}

func (e *Encryption) CompleteEncryption(data map[string]interface{}) map[string]interface{} {
	for key, value := range data {
		if value != nil {
			switch v := value.(type) {
			case string:
				data[key] = e.Encrypt(v)
			case map[string]interface{}:
				data[key] = e.CompleteEncryption(v)
			case []interface{}:
				for i, item := range v {
					if item != nil {
						switch itemValue := item.(type) {
						case string:
							data[key].([]interface{})[i] = e.Encrypt(itemValue)
						case map[string]interface{}:
							data[key].([]interface{})[i] = e.CompleteEncryption(itemValue)
						}
					}
				}
			}
		}
	}

	return data
}