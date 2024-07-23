
# AWS Serverless Architecture and Development

참고 : [AWS강의실](https://www.youtube.com/playlist?list=PLfth0bK2MgIbpsMNmche-YXWwwEN4qK5k)
## 목차
1. [Decoupling](#1-decoupling)
2. [이벤트 기반 아키텍처](#2-이벤트-기반-아키텍처)
3. [Serverless Framework](#3-serverless-framework)
4. [AWS의 EventBridge 이벤트 매칭 규칙](#4-aws의-eventbridge-이벤트-매칭-규칙)
5. [Serverless Lambda 기초](#5-serverless-lambda-기초)
6. [API Gateway 기초](#6-api-gateway-기초)
7. [JSON Web Token](#7-json-web-token)
8. [Aurora Serverless](#8-aurora-serverless)
---
## 1. Decoupling
디커플링 : 서로 결합이 되어있는 것을 분리시키는 작업(확장성)    
이벤트 큐를 이용해서 여러개의 로직으로 나눕니다. 이를 통해서 어플리케이션이 긴밀하지 않고 느슨하게 해주는 것을 디커플링이라고 합니다.
### Amazon SQS
Amazon SQS : AWS에서 제공하는 큐 서비스, 다른 서비스에서 사용할 수 있도록 메세지를 잠시 저장하는 용도, 하나의 메세지를 한 번만 처리
ex) 사용자가 업로드한 동영상을 기반으로 모델링을 만드는 서비스(S3에 업로드한 동영상을 EC2에서 처리해서 다시 S3버킷에 업로드)
<img src="img/aws_SQS.png"></img>

### Amazon SNS
Amazon SNS : 하나의 토픽에 전달된 내용을 구독한 모든 주체가 전달받아 처리 가능, 하나의 메세지를 여러 서비스에서 처리
ex) 피자 주문의 기능을 여러개로 나누는 예제
<img src="img/aws_SNS.png"></img>

### Fan Out Architecture    
Fan out Architecture : 하나의 메세지를 여러 주체가 처리하는 것
<img src="img/aws_Fan_Out.png"></img>
---
## 2. 이벤트 기반 아키텍처
### 이벤트의 특성
이벤트 : 명령이 아닌 관찰한 내용(답변이 필요 없음)
구성 요소 : 내용, 시간 및 주체, 불변성

### Amazon EventBridge
EventBridge : SaaS 어플리케이션 및 AWS 서비스에서 생성된 이벤트를 사용하여 이벤트 기반 애플리케이션을 대규모로 손쉽게 구축할 수 있는 서버리스 이벤트 버스
<img src="img/aws_EventBridge.png"></img> 
사진을 보면, 이벤트 버스 안에 있는 다양한 이벤트 들이 발생했을 때, 그것이 EventBridge의 규칙에 해당한다면 Amazon SNS, Lambda, SQS로 이어지게해준다.
     
### AWS API Call via CloudTrail
미리 지정된 Event이외에 상황을 처리할 때 로그를 이용하여 이벤트를 발생시키는 방법(규칙에 해당하지 않을 때)
<img src="img/aws_CloudTrail.png"></img>       
사진을 보면, API가 호출됐을 때, CloudTrail이 바로 규칙에 해당하지 않더라도, EventBridge에 연결되는 방식으로 이루어져 있습니다. 그렇게 이벤트를 처리할 수 있습니다.
     
## 3. Serverless Framework
### Serverless Framework       
사진을 보면, 이벤트 버스 안에 있는 다양한 이벤트 들이 발생했을 때, 그것이 EventBridge의 규칙에 해당한다면 Amazon SNS, Lambda, SQS로 이어지게해준다.
     
### AWS API Call via CloudTrail      
미리 지정된 Event이외에 상황을 처리할 때 로그를 이용하여 이벤트를 발생시키는 방법(규칙에 해당하지 않을 때)
<img src="img/aws_CloudTrail.png"></img>         
사진을 보면, API가 호출됐을 때, CloudTrail이 바로 규칙에 해당하지 않더라도, EventBridge에 연결되는 방식으로 이루어져 있습니다. 그렇게 이벤트를 처리할 수 있습니다.
---
## 3. Serverless Framework
### Serverless Framework     
Serverless Architecture를 쉽게 구현할 수 있는 오픈 소스 프레임워크
기능 : AWS Lambda의 배포 및 관리, CloudFormation 기반으로 AWS의 인프라 생성
<img src="img/aws_Serverless_Framwork.png"></img>         
사진을 보면, serverless가 함수와 인프라의 정보를 담은 yml파일을 이용해서 AWS CloudFormaion의 기반으로 솔루션을 구축해주는 것이 바로 Serverless Framework
### Serverless.yml        
AWS의 인프라와 Serverless Framework로 배포할 Lambda함수의 정보 및 설정을 담은 파일, 500개 리소스 제한인 CloudFormation 스택을 Nested Stack으로 만들어주는 플러그인
---
## 4. AWS의 EventBridge 이벤트 매칭 규칙
### Amazon EventBridge 규칙
* 발생한 이벤트를 대상 서비스가 처리할 수 있도록 전달
* 다양한 대상에 동시에 전달 가능
* 두 가지 모드
    * 이벤트 패턴 : AWS의 이벤트 버스에서 특정 이벤트를 패턴 매칭하여 대상에 전달
    * 스케쥴 : Cron 이벤트를 활용하여 특정 시간, 혹은 주기로 대상에게 전달
### 이벤트 패턴 매칭
* AWS의 이벤트의 내용중 필요한 내용만 선별해서 패턴으로 정의(ex) detail, region ...)
* 패턴에 매칭되는 이벤트를 대상으로 보냄
* JSON형식으로 구성(매칭하고 싶은 이벤트의 내용은 Array안에 넣어 매칭 -> 특정한 region이나 type)
* 일반적으로 Source 필드와 detail-type 필드를 매칭하여 이벤트 종류를 분리한 후 detail필드 안에 있는 값으로 세부 필터링
<img src="img/aws_EventBridge_rule.png"></img>
사진을 보면, 패턴에는 이벤트 코드에서 볼 detail-type 어떤 종류의 이벤트인지, 어디서 일어나는지, 어떤 상황에 일어나는지에 대한 부분을 패턴으로 지정했습니다.
---
## 5. Serverless Lambda 기초
### AWS Lambda
서버를 프로비저닝 또는 관리하지 않고도 모든 유형의 어플리케이션 또는 백엔드 서비스에 대한 코드를 실행할 수 있는 이벤트 중심의 서버리스 컴퓨팅 서비스
* 코드와 코드를 실행하기 위한 파일들을 업로드하면 서버 프로비전 없이 코드 실행
* 다양한 언어 지원(Java, C#, Go, Node.js, Python, Ruby, .NET)
* 두 가지 방법으로 호출
    * Event 기반
    * AWS의 다른 서비스 혹은 어플리케이션에서 직접 혹은 API Gateway를 이용
* 저렴한 가격

### 일반 구성
* IAM 역할
* 메모리(128 ~ 10240MB)
* 제한 시간 : 최대 15분

### Triger
* AWS를 호출하는 서비스(ex) API Gateway, SQS, S3)
* 각 서비스에서 호출 시 지정된 양식의 이벤트 내용을 전달
---
## 6. API Gateway 기초
### API Gateway 
어떤 규모든 개발자가 API를 손쉽게 생성, 게시, 유지 관리, 모니터링 및 보안 유지할 수 있도록 하는 완전관리형 서비스, 백엔드 서비스의 데이터 비즈니스 로직 또는 기능에 엑세스 할 수 있는 입구 역할을 합니다.    
* AWS의 서비스 및 외부 서비스를 위한 API를 생성/관리해주는 서비스
* HTTP/Websocket 프로토콜 지원
* 다양한 AWS서비스와 연동
* 배포 관리 가능
* API Key를 이용해 보안 관리와 사용량 추적 가능
<img src="img/aws_APIGateway.png"></img>
사진을 보면, Gateway를 통해서 Lambda나 DB같이 AWS 서비스에 사용자가 접근할 수 있습니다.     
---
## 7. JSON Web Token 
<img src="img/aws_Serverless_Session.png"></img>
사진을 보면 Serverless환경에서는 DB를 밖에 두어서 Session을 관리하는 것을 볼 수 있다. 하지만 DB와 커넥션을 맺거나 가져오는 과정이 오버헤드가 될 수 있다고 생각하기 때문에 다른 방법을 생각했습니다 -> 세션 정보를 클라이언트가 보관. 하지만 이 방법은 사용자가 정보를 변조해서 보내면 해킹이나 다른 위험이 생길 수 있기 때문에 이를 검증하는 것이 필요합니다. 이를 위해서 나온 것이 JSON Web Token입니다.
### JSON Web Token
* 사용자에 대한 정보를 저장하는 Claim 기반의 토큰
    * 토큰에 대상의 정보를 담는 방식
    * 장점 
        * 토큰 자체에 데이터를 저장하기 때문에 별도의 저장과정의 필요가 없다.
        * 자체적인 만료시간 구현 가능
    * 단점
        * 토큰 자체의 제어 불가능 -> 이를 보완하기 위해 만료시간을 구현해야함
        * 토큰에 정보를 담고 있어 탈취시 정보가 공개됨
* 구성
    * Header : 토큰의 타입과 알고리즘 종류
    * Payload : 실제 데이터가 저장되는 공간
        * iss : 토큰 발급자
        * sub : 토큰 제목
        * exp : 토큰 만료시간
        * iat : 토큰 발급시간
    * signature : Header와 Payload의 정보를 검증하기 위한 고유한 암호화 스트링
* 동작 방식
<img src="img/aws_JWT.png"></img>    
이 방식을 통해서 JWT를 생성합니다.
<img src="img/aws_JWT_after.png"></img>   
만든 JWT와 함께 데이터를 보내서 검증을 받은 후 권한이 맞다면 올바른 request값을 전달해줍니다.
---
## 8. Aurora Serverless
### Aurora Serverless
어플리케이션 요구사항을 기반으로 자동으로 시작 및 종료하고 용량을 확장 또는 축소합니다. 이를 통해 데이터베이스 용량을 관리하지 않고도 클라우드에서 데이터베이스를 실행할 수 있습니다.
* 특징
    * 사용한 리소스를 1초 단위로 과금
    * 용량은 10gb ~ 128Tb로 자동 스케일링
    * DB Cluster Parameter Group만 지원(Cluster 전체에 적용)
    * ACU(Aurora Capacity Unit)단위로 컴퓨팅 조절  
        * Warm Pool에서 인스턴스를 준비하고 스케일링에 따라 인스턴스를 할당/회수
        * 최대/최소 ACU 설정 가능
        * 약 2gb Ram, CPU, Network로 이해

### Aurora Serverless Architecture
<img src="img/aws_Aurora_Architecture.png"></img>
요청이 들어오면 Warm Instance Pool에서 인스턴스를 할당을 해준 후, Aurora Storage Layer에 저장합니다. traffic이 클수록 많은 인스턴스들을, 적을수록 적은 인스턴스들을 가져옵니다.    
* Aurora Serverless의 제약사항
    * VPC 밖에서 액세스 불가능 -> Public IP 할당 불가능, Data API를 통해 접근
    * Replica 불가능
    * 클로닝 불가능
    * 포트는 3306(MySQL), 5432(PosgreSQL) 고정
    * 엔진 버전 고정(5.6, 5.7)

### Data API
DB에는 Connection수의 제한이 있다. 하지만 Lambda같은 서비스는 순식간에 엄청난 수로 늘 수 있기 떄문에 이를 보완하기 위해 나온 게 Data API입니다. Aurora Serverless용 Data API를 이용하면 DB 클러스터에 웹 서비스 인터페이스로 작업 가능합니다.





