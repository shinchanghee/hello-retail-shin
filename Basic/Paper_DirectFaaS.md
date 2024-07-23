# [DirectFaaS: A Clean-Slate Network Architecture for Efficient Serverless Chain Communications](https://dl.acm.org/doi/abs/10.1145/3589334.3645333)
---
## 배경
<img src="img/DirectFaaS/Figure1.png"></img>
현재 Serverless 환경에서는 최대한 함수를 가볍게하기 위해 Service Mesh형이 아닌 API Gateway로 트래픽이 몰리는 방식을 쓰고 있습니다.     
API Gateway는 요청이 들어오면, 사용자를 검증하고, 요청의 양에 따라 함수 인스턴스의 양을 조절하고, 만약 함수가 일정시간동안 사용이 안 되며 종료한다. 그리고, 받은 요청을 적절한 함수에 전달하게 됩니다. 만약 트래픽이 몰리면 그 트래픽에 맞춰 많은 양의 함수 인스턴스를 사용합니다.     
이때 발생할 수 있는 네트워크 문제    
* 함수 체인은 꼭 API Gateway를 거쳐야하기때문에 지연이 발생할 수 있다.
* API Gateway에 트래픽의 병목현상이 생길 수 있다.
* API Gateway에 대한 보안 위협이 있다.
* 기존의 연구들은 속도를 높이려고는 하지만, API Gateway를 쓰는 네트워크 아키텍처를 유지하고 있다.

## 설계
### 시스템 설계

SDN을 이용해 기존의 API Gateway를 사용하는 방식과 다르게 설계했습니다.   
* 내부 함수 호출의 인증처리
    *  내부 함수의 대한 인증은 SDN기능을 이용합니다. Flow Table Generator가 Directed Acyclic Graph(DAG)를 기반으로 네트워크 정책을 생성합니다
    *  Flow table Translator가 만든 정책을 데이터 평면에 배포합니다.
    *  DAG에 있는 관계끼리만 호출이 가능하게 하고, 다른 호출은 다 거부합니다.
* IP주소를 알지 못한 채 함수 라우팅
    * 각 함수마다 vIP를 할당합니다.
    * 함수가 새로 생성될 때마다, Flow Table Generator는 vIP를 해당 함수 인스턴스의 동적 끝점 IP(eIP)로 매핑하는 플로우 테이블 규칙을 추가합니다.
* 함수가 0으로 스케일링 됐을 때의 스케일링
    * 함수 호출 횟수를 가상 스위치에 HPA Sacler를 이용해서 기록합니다.
### 제어 흐름 설계
* HPA Scaler는 API Gateway와 가상 스위치로부터 함수 호출 횟수를 얻고, apiserver로부터 함수 자원 사용량을 모니터링합니다.
* 새로운 함수 인스턴스가 생성되면, DirectFaaS 컨트롤러는 apiserver에서 해당 함수 인스턴스의 eIP를 얻어 플로우 테이블 규칙을 생성하고 배포합니다.
#### 속성
* Programmability : DirectFaaS 컨트롤러에 의해 생성된 제어 흐름은 서버리스 제공자에 의해 프로그래밍될 수 있기때문에 유연한 네트워크 관리와 정책 적용을 가능하게 합니다.
* Transparency : DirectFaaS의 수정 사항은 엔드 유저와 기존 서버리스 애플리케이션에 투명하게 적용되기 때문에 엔드 유저는 여전히 API Gateway를 통해서 함수를 호출합니다.

### 데이터 흐름 설계
* 사용자는 API Gateway를 이용해 함수를 호출/반환 합니다.
* 내부 함수간의 호출은 직접적으로 이루어지는데 가상 스위치를 이용해서 데이터 패킷을 목적지 함수에 전달하여 내부 함수간의 연결을 구현합니다.
<img src="img/DirectFaaS/Figure2.png"></img>
<img src="img/DirectFaaS/Figure3.png"></img>

## 구현
* API Gateway : OpenFaaS's API Gateway
* Apiserver : kubernetes API server
* HPA Scaler : KEDA
* DirectFaaS Controller : Kube-OVN Controller
* Virtual Switch : Open vSwitch


## 평가 
### 평가에 사용한 Serverless Application
* Bookinfo - 호출 관계를 이용한 네트워크 정책 및 내부 함수 호출
* Hello Reatil! - 트래픽 처리 능력 및 함수 스케일링
* Synthetic Application - 함수 체인 길이에 따른 성능 평가
### 권한 부여 평가
Bookinfo의 네트워크 정책에 맞는 요청을 30초에 10개씩, 총 300개의 요청을 보냈는데, 아래의 사진을 보면, 모두 잘 적용된 표를 볼 수 있다.
<img src="img/DirectFaaS/Figure4.png"></img>
### 라우팅 및 회복력 평가
각 함수에 맞는 vIP에 요청을 보내면, 그 함수는 응답을 보내야합니다. 실험에서는 Hello Reatail!의 chain3에 120초 동안 10개의 동시요청을 보냈습니다. 각 함수별 호출 횟수는 789번입니다. 아래 그래프를 보면 각 함수별로 789번 호출된 모습을 볼 수 있습니다. 그리고, 그래프를 보면 요청이 각 함수 인스턴스에 고르게 분포된 모습을 볼 수 있습니다.
<img src="img/DirectFaaS/Figure5.png"></img>
<img src="img/DirectFaaS/Figure6.png"></img>
### 실행시간 감소
Hello Retail의 각 chain을 사용해 함수 체인의 길이를 다르게 두고 내부 지연을 0ms와 0.5ms로 나누고 각 실험은 100번 반복해 평균 시간을 계산하였습니다.   
측정한 시간은 요청을 보내고 받기 까지의 시간을 측정한 것 입니다. 아래 사진을 보면 0ms의 지연이 있을 땐 24.4%, 0.5ms의 지연이 있을 땐 30.9%의 속도 감소를 확인할 수 있습니다. 그리고 함수 체인 길이에 따라 최대 약 24ms의 시간 단축을 볼 수 있었습니다.   
<img src="img/DirectFaaS/Figure7.png"></img>
### 자원 소비 감소
120초 동안 초당 10개의 요청부터 250개의 요청까지 점진적으로 부하를 증가시켰을 떄 각 부하 조건에서 CPU의 사용량과 메모리의 사용량을 측정했습니다. 아래 그래프를 보면 DirectFaaS는 OpenFaaS에 비해 CPU와 메모리를 더 적게 소비했습니다. 제어 노드에서는 DirectFaaS의 CPU 소비는 OpenFaaS보다 30.1% 감소했고, 워커 노드에서 DirectFaaS의 CPU 소비는 OpenFaaS보다 15.4% 감소했습니다. 그리고 워커 노드에서 DirectFaaS의 메모리 소비는 OpenFaaS보다 13.8% 감소했습니다.
<img src="img/DirectFaaS/Figure8.png"></img>
### 오버헤드 평가
실험을 위해 함수를 스케일링할 떄 사용되는 CPU를 측정했습니다. 아래 그래프를 보면 OpenFaaS의 CPU 사용량보다 DirectFaaS의 CPU 사용량이 더 적은 모습을 볼 수 있습니다. 이 이유는 DirectFaaS의 플로우 테이블 생성 및 배포 과정은 콜드 스타트 시간 동안 발생하므로, 실질적으로 추가적인 지연을 초래하지 않기때문입니다.
<img src="img/DirectFaaS/Figure9.png"></img>
## 기존 연구와의 차이
기존의 연구는 함수 호출 지연 시간을 줄이기 위해 다양한 접근 방식을 제안했습니다. 하지만 DirectFaaS는 함수 간 통신 지연을 줄이기 위해 기존 연구와 다르게 SDN 기능을 도입하여 함수 간 직접 통신을 가능하게 합니다. 그리고 API 게이트웨이를 내부 함수 호출에서 제거하여 네트워크 경로를 최적화하고, 지연을 최소화합니다.
## 결론
DirectFaaS는 serverless 함수 chain간의 통신을 더 효율적으로 개선했습니다. 이는 실행 시간과 리소스의 소모를 API Gateway와의 내부 함수간의 통신을 삭제하면서 줄였습니다. 이 결과는 SDN기반의 네트워크 사용을 통해서 얻어낼 수 있었습니다. 
