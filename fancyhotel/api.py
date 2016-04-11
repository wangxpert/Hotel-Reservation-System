from flask_restful import Resource, reqparse, abort, request
import db #instantiates the database so we don't have to do that in here
from datetime import datetime



#every method of a class has to have (self)
class NewUserRegistrationResource(Resource):

	def __init__(self): #the constructor
		self.reqparse = reqparse.RequestParser()
		self.reqparse.add_argument('username', type=str, required= True, help="Username is required to register", location='json')
		self.reqparse.add_argument('email', type=str, required= True, help="Email is required to register", location='json')
		self.reqparse.add_argument('password', type=str, required= True, help="Password is required to register", location='json')
		self.reqparse.add_argument('firstName', type=str, required= True, help="First name is required to register", location='json')
		self.reqparse.add_argument('lastName', type=str, required= True, help="Last name is required to register", location='json')
		super(NewUserRegistrationResource, self).__init__() #for flask to finish creating this resource

	def post(self): 
		args = self.reqparse.parse_args()
		username = args['username']
		email = args['email']
		password = args['password']
		firstName = args['firstName']
		lastName = args['lastName']

		if not db.mysqldb.user_exists(username) and  not db.mysqldb.email_exists(email):
			db.mysqldb.register_user(username, email, password, firstName, lastName)
			return {"message": "User successfully created", "result": True}
		else:
			return {"error": "This user already exists", "result": False}, 400

class LoginResource(Resource):
	
	def __init__(self):
		self.reqparse = reqparse.RequestParser()
		self.reqparse.add_argument('username', type=str, required= True, help="Username is required to sign in", location='json')
		self.reqparse.add_argument('password', type=str, required= True, help="Email is required to sign in", location='json')
		super(LoginResource, self).__init__()

	def post(self): #post request, because we are posting information to the database
		args = self.reqparse.parse_args()
		username = args['username']
		password = args['password']

		if db.mysqldb.login(username, password):
			return {"message": "You logged in!", "result": True}
		else:
			return {"error": "Login information invalid. Check your username or password", "result": False}, 401

class CreateReservationResource(Resource):
	def __init__(self):
		self.reqparse = reqparse.RequestParser()
		self.reqparse.add_argument('username', type=str, required=True, help="Please provide a username")
		self.reqparse.add_argument('checkIn', type=str, required=True, help="Please provide a checkIn")
		self.reqparse.add_argument('checkOut', type=str, required=True, help="Please provide a checkOut")
		self.reqparse.add_argument('card_number', type=str, required=True, help="Please provide a card_number")
		self.reqparse.add_argument('rooms', type=list, required=True, help="Please provide a list of rooms")
		super(CreateReservationResource, self).__init__()
		
	def post(self):
		args = self.reqparse.parse_args()
		json_body = request.json
		
		total_cost = 0
		checkInDate = datetime.strptime(args["checkIn"], "%Y-%m-%d")
		checkOutDate = datetime.strptime(args["checkOut"], "%Y-%m-%d")
		deltaDays = (checkOutDate - checkInDate).days
		
		for room in json_body['rooms']:
			total_cost += room['cost']
			if room['extra_bed_or_not'] == 1:
				total_cost = total_cost + room['extra_bed_price']
		total_cost *= deltaDays
		id, message, result = db.mysqldb.insert_reservation(args['username'], args['checkIn'], args['checkOut'], args['card_number'], json_body['rooms'], total_cost)
		
		if not result:
			return {"id": id, "message": message, "result": result}, 400
			
		return {"id": id, "message": message, "result": result}
		
class UpdateReservationResource(Resource):
	def __init__(self):
		self.reqparse = reqparse.RequestParser()
		self.reqparse.add_argument('reservation_id', type=str, required=True, help="Please provide a reservation_id")
		self.reqparse.add_argument('checkIn', type=str, required=True, help="Please provide a check-in date")
		self.reqparse.add_argument('checkOut', type=str, required=True, help="Please provide a check-out date")
		self.reqparse.add_argument('username', type=str, required=True, help="Please provide a user name")
		super(UpdateReservationResource, self).__init__()
	
	def put(self):
		args = self.reqparse.parse_args()
		 
		total_cost = 0
		checkInDate = datetime.strptime(args["checkIn"], "%Y-%m-%d")
		checkOutDate = datetime.strptime(args["checkOut"], "%Y-%m-%d")
		deltaDays = (checkOutDate - checkInDate).days
		print deltaDays
		rooms = db.mysqldb.get_rooms_for_reservation(args['username'], args['reservation_id'])
		for room in rooms:
			if not db.mysqldb.is_room_free(room['room_number'], room['location'], args['checkIn'], args['checkOut'], args['reservation_id']):
				return {"message": "Some rooms in your reservation are not free during the specified times", "result": False}, 400
				
			total_cost += room['cost']
			if room['extra_bed_or_not'] == '1':
				total_cost += room['extra_bed_price']
		#For the rooms in the reservation, check if each room is free during the requested times. If the room is not free, return false.
		print total_cost
		total_cost *= deltaDays
		message, status = db.mysqldb.update_reservation(args['username'], args['reservation_id'], args['checkIn'], args['checkOut'], total_cost)
		if status:
			return {"message": message, "result": status}
		else:
			return {"message": message, "result": status}, 400

class ReservationResource(Resource):
	def __init__(self):
		self.reqparse = reqparse.RequestParser()
		self.reqparse.add_argument('checkIn', type=str, required=True, help="Please provide a check-in date")
		self.reqparse.add_argument('checkOut', type=str, required=True, help="Please provide a check-out date")
		self.reqparse.add_argument('username', type=str, required=True, help="Please provide a user name")

		self.getreqparse = reqparse.RequestParser()
		self.getreqparse.add_argument('username', type=str, required=True, help="Please provide a user name")

		super(ReservationResource, self).__init__()

	def get(self, reservation_id):
		args = self.getreqparse.parse_args()
		reservation = db.mysqldb.get_reservation(args['username'], reservation_id, False)
		if reservation:
			return {"data": reservation, "result": True}
		else:
			return {"error": "No reservation found", "result": False}, 404

	def put(self, reservation_id): #update the reservation
		args = self.reqparse.parse_args()
		 
		total_cost = 0
		rooms = db.mysqldb.get_rooms_for_reservation(args['username'], reservation_id)
		for room in rooms:
			if not db.mysqldb.is_room_free(room['room_number'], room['location'], args['checkIn'], args['checkOut'], reservation_id):
				return {"message": "Some rooms in your reservation are not free during the specified times", "result": False}, 400
				
			total_cost += room['cost'] * deltaDays
			if room['extra_bed_or_not'] == 1:
				total_cost + room['extra_bed_price'] * deltaDays
		#For the rooms in the reservation, check if each room is free during the requested times. If the room is not free, return false.

		message, status = db.mysqldb.update_reservation(reservation_id, args['checkIn'], args['checkOut'], total_cost)
		if status:
			return {"message": message, "result": status}
		else:
			return {"message": message, "result": status}, 400

class UpdateReservationConfirmResource(Resource):
	def __init__(self):
		self.reqparse = reqparse.RequestParser()
		self.reqparse.add_argument('checkIn', type=str, required=True, help="Please provide a check-in date")
		self.reqparse.add_argument('checkOut', type=str, required=True, help="Please provide a check-out date")
		self.reqparse.add_argument('username', type=str, required=True, help="Please provide a user name")
		super(UpdateReservationConfirmResource, self).__init__()

	def get(self, reservation_id):
		args  = self.reqparse.parse_args()
		rooms = db.mysqldb.get_rooms_for_reservation(args['username'], reservation_id)
		for room in rooms:
			if not db.mysqldb.is_room_free(room['room_number'], room['location'], args['checkIn'], args['checkOut'], reservation_id):
				return {"message": "Some rooms in your reservation are not free during the specified times", "result": False}, 400
		return {"message": "Rooms are available", "result": True, "rooms": rooms}



class CancelReservationResource(Resource):
	def __init__(self):
		self.reqparse = reqparse.RequestParser()
		self.reqparse.add_argument('username', type=str, required=True, help="Please provide a user name")
		super(CancelReservationResource, self).__init__()

	def get(self, reservation_id):
		args = self.reqparse.parse_args()
		message, status = db.mysqldb.cancel_reservation(args['username'], reservation_id)
		if status:
			return {"message": "Cancelled reservation", "result": True}
		else:
			return {"message": message, "result": False}, 400

class SearchRoomsResource(Resource):
	def __init__(self):
		self.reqparse = reqparse.RequestParser()
		self.reqparse.add_argument('location', type=str, required= True, help="Please select a location")
		self.reqparse.add_argument('checkIn', type=str, required= True, help="Please select a check-in date")
		self.reqparse.add_argument('checkOut', type=str, required= True, help="Please select a check-out date")
		super(SearchRoomsResource, self).__init__()

	def get(self): #get request, because we are pulling info from the database
		args = self.reqparse.parse_args()
		location = args['location']
		checkIn = args['checkIn']
		checkOut = args['checkOut']
		print location
		return db.mysqldb.search_rooms(location, checkIn, checkOut)
		
class CreditCardResource(Resource):
	def __init__(self):
		self.reqparse = reqparse.RequestParser()
		self.reqparse.add_argument("username", type=str, required=True, help="Please provide a username")
		
		self.delete_reqparse = reqparse.RequestParser()
		self.delete_reqparse.add_argument("username", type=str, required=True, help="Please provide a username")
		self.delete_reqparse.add_argument("card_number", type=str, required=True, help="Please provide a card number")
		
		self.create_reqparse = reqparse.RequestParser()
		self.create_reqparse.add_argument("username", type=str, required=True, location='json', help="Please provide a username")
		self.create_reqparse.add_argument("card_number", type=str, required=True, location='json', help="Please provide a card_number")
		self.create_reqparse.add_argument("name", type=str, required=True, location='json', help="Please provide a name")
		self.create_reqparse.add_argument("cvv", type=str, required=True, location='json', help="Please provide a ccv")
		self.create_reqparse.add_argument("expiration_date", type=str, required=True, location='json', help="Please provide a expiration_date")
		
		super(CreditCardResource, self).__init__()
		
	def get(self):
		args = self.reqparse.parse_args()
		return db.mysqldb.get_credit_cards(args['username'])
		
	def post(self):
		args = self.create_reqparse.parse_args()
		message, status = db.mysqldb.add_credit_card(args['username'], args['card_number'], args['cvv'], args['expiration_date'], args['name'])
		if status:
			return {'message': message, 'result': status}
		return {'message': message, 'result': status}, 400
		
	def delete(self):
		args = self.delete_reqparse.parse_args()
		reservations = db.mysqldb.get_reservation_by_card_number(args['username'], args['card_number'])
		
		today = datetime.now()
		for reservation in reservations:
			if (datetime.strptime(reservation['checkout_date'], '%Y-%m-%d') - today).days > 0:
				return {'message': "This card is used in a future reservation!", 'result': False}, 400

		message, status = db.mysqldb.delete_credit_card(args['username'], args['card_number'])

		if status:
			return {'message': message, 'result': status}
		return {'message': message, 'result': status}, 400

class ReviewResource(Resource):
	def __init__(self):
		self.reqparse = reqparse.RequestParser()
		self.reqparse.add_argument("location", type=str, required=True, help="Please provide a location")
		
		self.create_reqparse = reqparse.RequestParser()
		self.create_reqparse.add_argument("username", type=str, required=True, location='json', help="Please provide a username")
		self.create_reqparse.add_argument("comment", type=str, required=True, location='json', help="Please provide a card_number")
		self.create_reqparse.add_argument("rating", type=str, required=True, location='json', help="Please provide a name")
		self.create_reqparse.add_argument("location", type=str, required=True, location='json', help="Please provide a ccv")
		
	def get(self):
		args = self.reqparse.parse_args()
		return db.mysqldb.get_reviews(args['location'])
	
	def post(self):
		args = self.create_reqparse.parse_args()
		message, status = db.mysqldb.add_review(args['username'], args['location'], args['comment'], args['rating'])
		if status:
			return {'message': message, 'result': status}
		return {'message': message, 'result': status}, 400
		
class ReservationReportResource(Resource):
	def get(self):
		return db.mysqldb.reservation_report()

class PopularRoomReportResource(Resource):
	def get(self):
		return db.mysqldb.room_report()

class RevenueReportResource(Resource):
	def get(self):
		return db.mysqldb.revenue_report()

class GetReservationByCardNumberResource(Resource):
	def __init__(self):
		self.reqparse = reqparse.RequestParser()
		self.reqparse.add_argument("username", type=str, required=True, help="Please provide a username")
		self.reqparse.add_argument("card_number", type=str, required=True, help="Please provide a card number")

	def get(self):
		args = self.reqparse.parse_args()
		return db.mysqldb.get_reservation_by_card_number(args['username'], args['card_number']) #returns an array of reservations



