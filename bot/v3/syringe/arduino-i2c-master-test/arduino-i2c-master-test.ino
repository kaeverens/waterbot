#include <Wire.h>
void setup() {
  Wire.begin();        // join i2c bus (address optional for master)
  Serial.begin(9600);  // start serial for output
}
void loop() {
  if (Serial.available() > 0) {
    Wire.beginTransmission(8);
    while(Serial.available()>0) {
      Wire.write(Serial.read());
    }
    Wire.endTransmission();
    Wire.requestFrom(1, 6);    // request 6 bytes from slave device #8
    while (Wire.available()) { // slave may send less than requested
      char c = Wire.read(); // receive a byte as character
      Serial.print(c);         // print the character
    }
  }

  delay(500);
}
