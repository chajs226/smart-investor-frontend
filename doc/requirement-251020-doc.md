1. 소셜 로그인으로 로그인 성공하면, 네이버에게 전달받은 이메일 주소를 supabase db와 연결해서 회원정보에 저장해줘
2. 기업 분석결과는 자동으로 SUPABASE DB에 저장해줘
    - 테이블 구조 예시
        - market : 코스닥/유가/NASDAQ
        - symbol : 주식 티커/코드명,
        - name : 기업명
        - sector : 기업섹터
        - report: 분석 결과 리포트
        - createdAt: 리포트 생성일시
        
위 요구사항을 만족하기 위해 필요한 작업 리스트를 todo-251020.md 파일에 정리해줘