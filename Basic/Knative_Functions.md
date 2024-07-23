
## Knative Functions

knative환경에서 사용하는 함수들로 knative나 kubernetes, containers, 그리고 Docker에 대해 깊은 지식이 없어도 사용가능하다   
knative functions들은 쉽게 만들고, 이미지화하고, 배포하는게 쉽다.   
knative functions들은 이벤트 기반의 함수이기에 상태가 항상 켜져있지않다. 즉 다시말해 이벤트가 발생했을 때 작동하는 함수이다.   
func나 kn func 명령어를 통해 함수들이 관리된다.
|사용 가능 언어|
|---|
|Node.js|
|Python|
|Go|
|Quarkus|
|Rust|
|Spring Boot|
|TypeScript|


## Before Start
Install Knative Serving, Eventing and Istoctl

## Install func CLI
knative functions를 만들고 배포할 때 func라는 명령어를 사용하기 떄문에 func라는 명령어를 설치해야한다.
```bash
brew tap knative-extensions/kn-plugins
brew install func    
```

## Creating Functions
기본적으로 함수를 만들 땐 func create -l <language> <function-name> 라는 명령어를 사용한다.
```bash
func create -l <language> <function-name>
```
예시로 go 언어를 이용해 hello라는 함수를 만들어보겠습니다.   
함수에는 http요청이 들어오면 요청이 들어왔다고 알려주는 간단한 함수로 이루어져 있습니다.
```bash
func create -l go hello
```

## Building Functions
만든 함수를 container image로 만들어줍니다.   
```bash
cd hello
func build
```
<img src="img/func_build.png"></img>

## Running Functions
만든 함수의 실행을 확인해 보겠습니다.   
```bash
func run --build
```
를 이용해서 함수 빌드 후 실행이 가능하고, --build = false 옵션을 주면 build하지 않고 바로 실행이 가능합니다.   
실행 후 다른 터미널에서 func invoke 실행시 응답이 오는 것을 확인 가능합니다.   
<img src="img/func_run.png"></img>

## Subscribing Functions
함수를 특정 웹 페이지에 구독 시킬 수 있습니다. 다시 말해 어떤 한 웹페이지가 시작된다면, 구독 시킨 함수가 발생하는 것 입니다.   
특정 브로커를 가리키는 함수를 이벤트에 구독   
```bash
func subscribe --filter type=com.example --filter extension=my-extension-value --source my-broker
```
기본 브로커를 가리키는 함수를 이벤트에 구독
```bash
func subscribe --filter type=com.example --filter extension=my-extension-value
```
여기서 브로커란, 네트워크에서 라우팅이나 애플리케이션 간 통신은 담당하는 것을 말한다.

## Deploying functions
함수를 Docker repository에 저장하고 함수 호출을 요청해보겠습니다.   
함수를 Docker Repo에 저장
```bash
func deploy --registry <registry>
```
Docker Repo에 저장된 모습을 확인 가능합니다.   
<img src="img/func_deploy.png"></img>

함수를 실행
```bash
func invoke
```
함수를 실행하면 함수 호출에 대한 응답을 받을 수 있습니다.   
<img src="img/func_invoke.png"></img>

  

