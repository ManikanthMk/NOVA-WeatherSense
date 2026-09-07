#include <ESP8266WiFi.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <ESP8266HTTPClient.h>
const char* ssid="YOUR_WIFI_NAME"; const char* password="YOUR_WIFI_PASSWORD";
const char* serverURL="http://YOUR_PC_IP:10000/api/sensor"; // replace with Render URL after deployment
#define DEVICE_ID "nova-weather-01"
#define DHTPIN D4
#define DHTTYPE DHT11
DHT dht(DHTPIN,DHTTYPE);
#define RAIN_PIN D5
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH,SCREEN_HEIGHT,&Wire,-1);
void setup(){Serial.begin(115200);delay(1000);Wire.begin(D2,D1);if(!display.begin(SSD1306_SWITCHCAPVCC,0x3C)){Serial.println("OLED NOT FOUND!");while(true)delay(100);}dht.begin();pinMode(RAIN_PIN,INPUT);WiFi.mode(WIFI_STA);WiFi.begin(ssid,password);Serial.print("WiFi Connecting");while(WiFi.status()!=WL_CONNECTED){delay(500);Serial.print('.');}Serial.println();Serial.println("WiFi: CONNECTED");Serial.print("IP: ");Serial.println(WiFi.localIP());}
void loop(){float temperature=dht.readTemperature(),humidity=dht.readHumidity();String rainStatus=digitalRead(RAIN_PIN)==LOW?"WET":"DRY";if(isnan(temperature)||isnan(humidity)){Serial.println("DHT11 ERROR!");delay(2000);return;}Serial.printf("Temperature: %.1f C\nHumidity: %.1f %%\nRain: %s\n",temperature,humidity,rainStatus.c_str());display.clearDisplay();display.setTextColor(SSD1306_WHITE);display.setTextSize(1);display.setCursor(0,0);display.println("NOVA WeatherSense");display.drawLine(0,10,127,10,SSD1306_WHITE);display.setCursor(0,17);display.printf("Temp: %.1f C",temperature);display.setCursor(0,30);display.printf("Humidity: %.1f %%",humidity);display.setCursor(0,43);display.print("Rain: ");display.println(rainStatus);display.setCursor(0,56);display.println("Cloud Sync...");display.display();if(WiFi.status()==WL_CONNECTED){WiFiClient client;HTTPClient http;http.begin(client,serverURL);http.addHeader("Content-Type","application/json");String json="{\"deviceId\":\""+String(DEVICE_ID)+"\",\"temperature\":"+String(temperature,1)+",\"humidity\":"+String(humidity,1)+",\"rain\":\""+rainStatus+"\"}";int code=http.POST(json);Serial.print("Cloud HTTP Code: ");Serial.println(code);if(code>0)Serial.println(http.getString());else Serial.println("Cloud request failed");http.end();}delay(10000);}
