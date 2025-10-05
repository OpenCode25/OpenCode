def run(args):
    if len(args) != 2:
        print("Usage: add <num1> <num2>")
        return
    try:
        a = float(args[0])
        b = float(args[1])
        print(f"The sum is: {a + b}")
    except ValueError:
        print("Enter valid numbers.")
