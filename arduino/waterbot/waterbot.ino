#include <Stepper.h>
// { constants
const int stepsPerRevolution = 2048;
const int stepsPerML=stepsPerRevolution/1.7; // negative pushes down
const int A1A = 9;
const int A1B = 8;
const int SYRINGE_LIMIT = 2;
const int BUMPER_FRONT = 4;
const int BUMPER_BACK = 6;
const int BUMPER_BOTTOM = 5;
// }
int state=0; // return to home
float waterML=0;

const int INPUT_SIZE=30; // max expected input size

Stepper myStepper = Stepper(stepsPerRevolution, 10, 12, 11, 13);

// the setup function runs once when you press reset or power the board
void setup() {
  Serial.begin(9600);
  
  myStepper.setSpeed(10);
  stepperOff();

  // motors
  pinMode(A1A, OUTPUT);
  pinMode(A1B, OUTPUT);
    
  // syringe
  pinMode(SYRINGE_LIMIT, INPUT_PULLUP);

  // bumpers
  pinMode(BUMPER_FRONT, INPUT_PULLUP);
  pinMode(BUMPER_BACK, INPUT_PULLUP);
  pinMode(BUMPER_BOTTOM, INPUT_PULLUP);
  
  Serial.println("booted");
  stepperOff();
}

void loop() {
  switch (state) {
    case 0: // return to home and refill syringe
      returnToHome();
      Serial.println("setState: 2"); // refilling syringe
      emptySyringe();
      syringe(6);
      Serial.println("setState: 3");
      state=3; // wait for command
    break;
    case 1: // return to home
      returnToHome();
      Serial.println("setState: 3");
      state=3;
    break;
    case 3: // waiting for command
      readCommand();
    break;
  }
}

void syringe(float ml) {
  myStepper.step(stepsPerML * ml);
  waterML+=ml;
  stepperOff();  
}

void readCommand() {
  if (Serial.available() > 0) {
    String input=Serial.readString();
    String cmd=getValue(input, ' ', 0);
    String pot=getValue(input, ' ', 1);
    String ml=getValue(input, ' ', 2);
    Serial.println(cmd+", "+pot+", "+ml);
    if (cmd.equals("water")) {
      float fml=ml.toFloat();
      if (fml>waterML) { // not enough water - refill
        emptySyringe();
        syringe(6);
      }
      waterPot(pot.toInt(), ml.toFloat());
    }
    else {
      Serial.println("unknown command: "+input);
    }
  }
}

void motorDelay(char dir, int msOn, int msOff) {
  motor(dir);
  delay(msOn);
  motor('O');
  delay(msOff);
}

void waterPot(int pot, float ml) {
  int msOn=10;
  int msOff=10;
  for (int i=0;i<pot;++i) {
    if (i) { // control speed after first marker
      msOn=10;
      msOff=20;
      if (pot-i==1) {
        msOff=40;
      }
      if (pot-i==2) {
        msOff=30;
      }
    }
    moveToNextPot(msOn, msOff);
  }
  syringe(ml*-1);
  state=1; // go back to base for more instruction
}

void moveToNextPot(int msOn, int msOff) {
  int val=1;  
  do { // make sure we are clear of the last bump
    motorDelay('R', msOn, msOff);
    val=digitalRead(BUMPER_BOTTOM);
  } while(val);
  do { // move until bottom button clicks
    motorDelay('R', msOn, msOff);
    val=digitalRead(BUMPER_BOTTOM);
  } while(!val);
}

void returnToHome() {
  int val=1;
  if (!digitalRead(BUMPER_FRONT)) { // already home
    Serial.println("setState: 1");
    return;
  }
  do { // move to base at half speed
    motorDelay('L', 20, 20);
    val=digitalRead(BUMPER_FRONT);
  } while(val);
  delay(100);
  do { // try this a few times until it sticks
   do { // move to base again but at slower speed
     motorDelay('L', 20, 40);
   } while(digitalRead(BUMPER_FRONT));
   delay(1000);
  } while(digitalRead(BUMPER_FRONT));
  Serial.println("setState: 1");
}

String getValue(String data, char separator, int index) {
  int found = 0;
  int strIndex[] = { 0, -1 };
  int maxIndex = data.length() - 1;
  for (int i = 0; i <= maxIndex && found <= index; i++) {
    if (data.charAt(i) == separator || i == maxIndex) {
      found++;
      strIndex[0] = strIndex[1] + 1;
      strIndex[1] = (i == maxIndex) ? i+1 : i;
    }
  }
  return found > index ? data.substring(strIndex[0], strIndex[1]) : "";
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

void motor(char d) {
  if(d =='R'){
    digitalWrite(A1A,LOW);
    digitalWrite(A1B,HIGH); 
  }
  else if (d =='L'){
    digitalWrite(A1A,HIGH);
    digitalWrite(A1B,LOW);    
  }
  else{
    //Robojax.com L9110 Motor Tutorial
    // Turn motor OFF
    digitalWrite(A1A,LOW);
    digitalWrite(A1B,LOW);    
  }
}

void stepperOff() {
  digitalWrite(10,LOW);
  digitalWrite(11,LOW);
  digitalWrite(12,LOW);
  digitalWrite(13,LOW);
}
