def add(a, b):
    """Return the sum of a and b."""
    return a + b

def subtract(a, b):
    """Return a minus b."""
    return a - b

def multiply(a, b):
    """Return the product of a and b."""
    return a * b

def divide(a, b):
    """Return a divided by b. Raises ZeroDivisionError if b is zero."""
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b

class Calculator:
    """A simple calculator class."""
    def __init__(self, initial_value=0):
        self.value = initial_value

    def add(self, x):
        self.value += x
        return self.value

    def subtract(self, x):
        self.value -= x
        return self.value

    def multiply(self, x):
        self.value *= x
        return self.value

    def divide(self, x):
        if x == 0:
            raise ZeroDivisionError("Cannot divide by zero")
        self.value /= x
        return self.value

if __name__ == "__main__":
    # Test basic functions
    print("Testing basic functions:")
    print(f"add(2, 3) = {add(2, 3)}")
    print(f"subtract(10, 4) = {subtract(10, 4)}")
    print(f"multiply(5, 6) = {multiply(5, 6)}")
    print(f"divide(15, 3) = {divide(15, 3)}")

    # Test Calculator class
    calc = Calculator()
    print("\nTesting Calculator class:")
    print(f"Initial value: {calc.value}")
    print(f"After add(5): {calc.add(5)}")
    print(f"After multiply(3): {calc.multiply(3)}")
    print(f"After subtract(4): {calc.subtract(4)}")
    print(f"After divide(2): {calc.divide(2)}")

    # Additional assertions for correctness
    assert add(2, 3) == 5, "Addition failed"
    assert subtract(10, 4) == 6, "Subtraction failed"
    assert multiply(5, 6) == 30, "Multiplication failed"
    assert divide(15, 3) == 5.0, "Division failed"

    calc_test = Calculator(10)
    assert calc_test.add(5) == 15, "Calculator add failed"
    assert calc_test.multiply(2) == 30, "Calculator multiply failed"
    assert calc_test.subtract(10) == 20, "Calculator subtract failed"
    assert calc_test.divide(4) == 5.0, "Calculator divide failed"

    print("\nAll tests passed!")