#include <Wire.h>
#include <Stepper.h>
// { constants
const int stepsPerRevolution = 2048;
const int stepsPerML=stepsPerRevolution/1.7; // negative pushes down
const int SYRINGE_LIMIT = 10;
const int STEPPER_IN1 = 4;
const int STEPPER_IN2 = 5;
const int STEPPER_IN3 = 6;
const int STEPPER_IN4 = 7;
// }
float waterML=0;

Stepper myStepper = Stepper(stepsPerRevolution, STEPPER_IN1, STEPPER_IN3, STEPPER_IN2, STEPPER_IN4);

// the setup function runs once when you press reset or power the board
void setup() {
  Serial.begin(9600);
  myStepper.setSpeed(10);
  stepperOff();
  pinMode(SYRINGE_LIMIT, INPUT_PULLUP);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.println("booted\n");
  Wire.begin(8);
  Wire.onRequest(requestEvent);
  emptySyringe();
}

void loop() {
  delay(100);
}

void requestEvent(int howMany) {
  digitalWrite(LED_BUILTIN, HIGH);
  while(1<Wire.available()) {
    char c=Wire.read();
    Serial.print(c);
  }
  int x=Wire.read();
  Serial.println(x);
  Wire.write('request received');
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
}

void syringe(float ml) {
  myStepper.step(stepsPerML * ml);
  waterML+=ml;
  stepperOff();  
}

void emptySyringe() {
  int val=1;
  do {
    myStepper.step(-stepsPerML/10);
    val=digitalRead(SYRINGE_LIMIT);
  } while(val);
  waterML=0;
  stepperOff();
}

void stepperOff() {
  digitalWrite(STEPPER_IN1, LOW);
  digitalWrite(STEPPER_IN2, LOW);
  digitalWrite(STEPPER_IN3, LOW);
  digitalWrite(STEPPER_IN4, LOW);
}
