
import click
from api.models import db, Employee

"""
In this file, you can add as many commands as you want using the @app.cli.command decorator
Flask commands are usefull to run cronjobs or tasks outside of the API but sill in integration 
with youy database, for example: Import the price of bitcoin every night as 12am
"""
def setup_commands(app):
    
    """ 
    This is an example command "insert-test-Employees" that you can run from the command line
    by typing: $ flask insert-test-Employees 5
    Note: 5 is the number of Employees to add
    """
    @app.cli.command("insert-test-Employees") # name of our command
    @click.argument("count") # argument of out command
    def insert_test_Employees(count):
        print("Creating test Employees")
        for x in range(1, int(count) + 1):
            employee = Employee()
            employee.email = "test_Employee" + str(x) + "@test.com"
            employee.password = "123456"
            employee.is_active = True
            db.session.add(employee)
            db.session.commit()
            print("Employee: ", employee.email, " created.")

        print("All test Employees created")

    @app.cli.command("insert-test-data")
    def insert_test_data():
        pass