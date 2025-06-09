#!/bin/bash

set -e

# Base URL
BASE_URL="http://localhost:3000/api"

# Màu sắc cho output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Biến đếm test
PASSED=0
FAILED=0

# Hàm in kết quả
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ $2${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ $2${NC}"
    echo -e "${RED}Chi tiết lỗi:${NC}"
    echo "$3"
    ((FAILED++))
  fi
  echo "-----------------------------"
}

# Hàm tạo email ngẫu nhiên
random_email() {
  echo "testuser_$(date +%s%N | cut -b10-19)$RANDOM@example.com"
}

# Hàm kiểm tra kết nối server
check_server() {
  if ! curl -s "$BASE_URL" > /dev/null; then
    echo -e "${RED}Không thể kết nối đến server. Vui lòng đảm bảo server đang chạy ở port 3000${NC}"
    exit 1
  fi
}

echo -e "${YELLOW}Bắt đầu kiểm tra API...${NC}\n"

# Kiểm tra kết nối server
check_server

# Tạo dữ liệu test
USER_EMAIL=$(random_email)
ADMIN_EMAIL=$(random_email)
NAIL_ARTIST_EMAILS=()
for i in 1 2 3; do
  NAIL_ARTIST_EMAILS+=("$(random_email)")
done
PASSWORD="password123"

echo "Dữ liệu test đã được tạo:"
echo "Email người dùng: $USER_EMAIL"
echo "Email admin: $ADMIN_EMAIL"
echo "Email thợ nail: ${NAIL_ARTIST_EMAILS[@]}"
echo ""

# Test 1: Đăng ký người dùng
echo "Test 1: Đăng ký người dùng"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"'$USER_EMAIL'","password":"'$PASSWORD'","role":"USER"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "RESPONSE: $BODY"
print_result $([ "$HTTP_CODE" -eq 201 ] && echo 0 || echo 1) "Đăng ký người dùng" "$BODY"
echo "Đã xong test 1"

# Test 2: Đăng nhập người dùng
echo -e "\nTest 2: Đăng nhập người dùng"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"'$USER_EMAIL'","password":"'$PASSWORD'"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
USER_TOKEN=$(echo "$BODY" | grep -o '"token":"[^\"]*' | cut -d'"' -f4)
echo "RESPONSE: $BODY"
print_result $([ "$HTTP_CODE" -eq 200 ] && [ ! -z "$USER_TOKEN" ] && echo 0 || echo 1) "Đăng nhập người dùng" "$BODY"
echo "Đã xong test 2"

# Test 3: Đăng ký thợ nail
echo -e "\nTest 3: Đăng ký thợ nail"
for i in "${!NAIL_ARTIST_EMAILS[@]}"; do
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/nail-artists/register" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -d '{"email":"'${NAIL_ARTIST_EMAILS[$i]}'","password":"'$PASSWORD'","name":"Thợ '$((i+1))'","phone":"012345678'$((i+1))'","address":"Địa chỉ '$((i+1))'","latitude":10.7'$((i+1))',"longitude":106.7'$((i+1))',"description":"Mô tả '$((i+1))'"}')
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  echo "RESPONSE: $BODY"
  print_result $([ "$HTTP_CODE" -eq 201 ] && echo 0 || echo 1) "Đăng ký thợ nail $((i+1))" "$BODY"
  echo "Đã xong test 3.$((i+1))"
done

# Test 4: Đăng ký admin
echo -e "\nTest 4: Đăng ký admin"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"'$ADMIN_EMAIL'","password":"'$PASSWORD'","role":"ADMIN"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
echo "RESPONSE: $BODY"
print_result $([ "$HTTP_CODE" -eq 201 ] && echo 0 || echo 1) "Đăng ký admin" "$BODY"
echo "Đã xong test 4"

# Test 5: Đăng nhập admin
echo -e "\nTest 5: Đăng nhập admin"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"'$ADMIN_EMAIL'","password":"'$PASSWORD'"}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
ADMIN_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "RESPONSE: $BODY"
print_result $([ "$HTTP_CODE" -eq 200 ] && [ ! -z "$ADMIN_TOKEN" ] && echo 0 || echo 1) "Đăng nhập admin" "$BODY"
echo "Đã xong test 5"

# Test 6: Lấy danh sách thợ nail
echo -e "\nTest 6: Lấy danh sách thợ nail"
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL/admin/nail-artists?limit=100")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')
NAIL_ARTIST_IDS=()
for EMAIL in "${NAIL_ARTIST_EMAILS[@]}"; do
  ID=$(echo "$BODY" | jq -r ".data[] | select(.user.email == \"$EMAIL\") | .id" 2>/dev/null)
  if [ -z "$ID" ]; then
    echo "Không tìm thấy ID cho email $EMAIL"
    continue
  fi
  NAIL_ARTIST_IDS+=("$ID")
done
echo "RESPONSE: $BODY"
print_result $([ "$HTTP_CODE" -eq 200 ] && [ ${#NAIL_ARTIST_IDS[@]} -eq 3 ] && echo 0 || echo 1) "Lấy danh sách thợ nail" "$BODY"
echo "Đã xong test 6"

# Test 7: Duyệt thợ nail
echo -e "\nTest 7: Duyệt thợ nail"
for ID in "${NAIL_ARTIST_IDS[@]}"; do
  RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/admin/nail-artists/$ID/approve" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  echo "RESPONSE: $BODY"
  print_result $([ "$HTTP_CODE" -eq 200 ] && echo 0 || echo 1) "Duyệt thợ nail ID: $ID" "$BODY"
  echo "Đã xong test 7.$ID"
done

# Test 8: Tạo đánh giá
echo -e "\nTest 8: Tạo đánh giá"
for i in "${!NAIL_ARTIST_IDS[@]}"; do
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/reviews" \
    -H "Authorization: Bearer $USER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"nailArtistId":'${NAIL_ARTIST_IDS[$i]}',"rating":'$((6-i))',"comment":"Đánh giá '$((i+1))'"}')
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  echo "RESPONSE: $BODY"
  print_result $([ "$HTTP_CODE" -eq 201 ] && echo 0 || echo 1) "Tạo đánh giá cho thợ nail $((i+1))" "$BODY"
  echo "Đã xong test 8.$((i+1))"
done

# Test 9: Lấy danh sách đánh giá
echo -e "\nTest 9: Lấy danh sách đánh giá"
if [ ${#NAIL_ARTIST_IDS[@]} -gt 0 ]; then
  RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/reviews/nail-artist/${NAIL_ARTIST_IDS[0]}")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  echo "RESPONSE: $BODY"
  print_result $([ "$HTTP_CODE" -eq 200 ] && echo 0 || echo 1) "Lấy danh sách đánh giá" "$BODY"
else
  echo "Không có thợ nail nào để lấy đánh giá"
  print_result 1 "Lấy danh sách đánh giá" "Không có thợ nail nào"
fi
echo "Đã xong test 9"

# Test 10: Lấy thông tin chi tiết thợ nail
echo -e "\nTest 10: Lấy thông tin chi tiết thợ nail"
for ID in "${NAIL_ARTIST_IDS[@]}"; do
  RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/nail-artists/$ID")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  echo "RESPONSE: $BODY"
  print_result $([ "$HTTP_CODE" -eq 200 ] && echo 0 || echo 1) "Lấy thông tin chi tiết thợ nail ID: $ID" "$BODY"
  echo "Đã xong test 10.$ID"
done

# In tổng kết
echo -e "\n${YELLOW}Tổng kết kiểm tra:${NC}"
echo -e "${GREEN}Thành công: $PASSED${NC}"
echo -e "${RED}Thất bại: $FAILED${NC}"
echo -e "${YELLOW}Tổng số test: $((PASSED + FAILED))${NC}"

# Luôn exit 0 để không dừng giữa chừng
exit 0 