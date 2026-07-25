# REFACTOR_NOTES.md — Code Review Task

A review of the `Car` / `TeslaCar` snippet from the assignment: what is wrong with
it, the corrected code, and the reasoning behind each change.

**Scope.** This is a refactor of the given snippet, not a redesign. Every change
below repairs something concretely wrong with the original — a bug, a violation of
PSR-12, or a rule the code states and then breaks. Changes that would restructure
the design more broadly are deliberately kept out of the primary solution and listed
under [Possible future improvements](#possible-future-improvements) instead.

---

## The original code

```php
<?php
class Car {
  public $name;
  function __construct() {
  }
  function get_name() {
    return $this->name;
  }
  function print_assembly() {
    echo "The Tesla Car finishes assembly every Friday at 5pm.";
  }
}
class TeslaCar extends Car {
  function generate_assembly_reports() {
    echo "Generating assembly reports...";
    echo "Exporting CSV format reports...";
    echo "Printing reports...";
  }
}
$car = new TeslaCar("Model_3");
echo $car->get_name();
echo "<br>";
$car->generate_assembly_reports();
?>
```

## What it actually does

Before discussing style, it is worth being precise about the behaviour, because the
headline bug is easy to miss:

`new TeslaCar("Model_3")` passes an argument to a constructor declared as
`__construct()` — which takes no parameters and has an empty body. PHP does **not**
error on the extra argument for a userland function, so the call succeeds and
`$name` is silently never assigned. `echo $car->get_name()` therefore prints
**nothing at all**: an untyped property defaults to `null`, and `null` cast to
string is `""`.

Verified on PHP 8.4 — the script exits 0 and its output begins with `<br>`, with no
notice, warning, or deprecation of any kind:

```
<br>Generating assembly reports...Exporting CSV format reports...Printing reports...
```

So the snippet does not fail loudly — it fails completely silently, which is worse:
there is no diagnostic anywhere pointing at the constructor. That is the first thing
to fix, and issue 2 below is what makes this class of bug impossible to reintroduce.

---

## Issues found

### 1. The constructor ignores its argument — the actual bug

```php
function __construct() { }          // takes nothing, does nothing
$car = new TeslaCar("Model_3");     // passes "Model_3" into the void
```

**Why it matters:** this is a silent data-loss bug, not a style issue. Every object
is constructed in an invalid state and the only symptom is an empty string on
screen. The constructor must accept the value it is plainly meant to receive.
Constructor promotion is used so the property is declared and assigned in one place
rather than two that can drift apart.

### 2. No type declarations

`public $name` accepts anything; `get_name()` declares no return type. **Why it
matters:** the class cannot state its own contract, so mistakes surface far from
their cause. This is also the direct enabler of issue 1: an untyped property is
implicitly `null`, so "never assigned" is indistinguishable from "assigned null". A
typed `private readonly string $name` has no implicit default — reading it before
assignment is an immediate `Error`, so the same bug would have announced itself on
the first run:

```
Error: Typed property Car::$name must not be accessed before initialization
```

### 3. `public $name` alongside a getter

**Why it matters:** the two contradict each other — the getter implies controlled
access while the public property lets any caller do `$car->name = 'anything'`. One
of them has to go, and since the class already provides `get_name()`, the property
becomes `private`. It is also `readonly`: a car's model name is fixed at
construction, and `readonly` states that in the language rather than in a comment.

### 4. `print_assembly()` hardcodes "Tesla" in the base class

```php
class Car {
  function print_assembly() {
    echo "The Tesla Car finishes assembly every Friday at 5pm.";
  }
}
```

**Why it matters:** the generic `Car` class asserts a fact about one specific
manufacturer. Any future `FordCar` would inherit a method that states something
false about itself, and the base class now depends on a detail of one of its
children — backwards.

**The conservative fix is a plain method override:** `Car` returns a neutral
statement built from the car's own name, and `TeslaCar` overrides it with the Tesla
schedule. This is ordinary inheritance, uses no new constructs, and leaves `Car`
instantiable exactly as it was in the original. (Making `Car` abstract with an
abstract schedule method would enforce this more strictly — see
[future improvements](#1-make-car-abstract).)

### 5. `generate_assembly_reports()` does three unrelated jobs

```php
echo "Generating assembly reports...";
echo "Exporting CSV format reports...";
echo "Printing reports...";
```

**Why it matters:** generating, exporting to CSV, and printing are three distinct
operations behind one name, so a caller who wants only the CSV cannot avoid
triggering a print. They are split into three methods that each do one thing, and
`generateAssemblyReports()` is kept as a thin orchestrator that calls all three —
so the original call site continues to work unchanged.

### 6. `echo` inside the classes

**Why it matters:** a class that writes directly to output can only ever be used in
one context. It cannot be asserted on in a unit test without output buffering, and
cannot be reused from a CLI command or an API response. The methods return strings;
the caller decides what to do with them.

### 7. `snake_case` method names violate PSR-12

`get_name()`, `print_assembly()`, `generate_assembly_reports()` → PSR-12 requires
`camelCase` for methods. **Why it matters:** consistency with the wider PHP
ecosystem, and with the rest of this project — a codebase mixing both conventions
forces a lookup at every call site.

### 8. Missing visibility modifiers

`function get_name()` is implicitly public. **Why it matters:** implicit visibility
makes it impossible to tell whether "public" was a decision or an oversight. PSR-12
requires it to be explicit.

### 9. `echo "<br>"` hardcodes HTML into the logic

**Why it matters:** the same code cannot then run from the CLI, where `<br>` prints
literally. Line breaks are a presentation concern — `PHP_EOL` at the call site.

### 10. The closing `?>` tag

**Why it matters:** not cosmetic. Any whitespace or newline after `?>` is sent
straight to the output buffer, a classic cause of "headers already sent" errors.
PSR-12 requires it to be omitted from files containing only PHP.

### 11. No `declare(strict_types=1)`

**Why it matters:** without it PHP coerces silently — `new TeslaCar(123)` would
quietly become the string `"123"`. Strict types turn that into a `TypeError` at the
boundary, which is where you want to find it.

---

## The corrected code

```php
<?php

declare(strict_types=1);

class Car
{
    /**
     * Constructor promotion: declares and assigns in one place, so the
     * "declared but never assigned" bug in the original cannot recur.
     *
     * private  — callers use the accessor instead of touching state directly.
     * readonly — a model name is fixed at manufacture; enforced, not documented.
     */
    public function __construct(
        private readonly string $name,
    ) {
    }

    /**
     * PSR-12 camelCase, explicit visibility, declared return type.
     */
    public function getName(): string
    {
        return $this->name;
    }

    /**
     * The base class no longer claims to know any manufacturer's schedule — it
     * states only what is true of a car in general. Subclasses override this
     * with their own schedule (see TeslaCar).
     *
     * Returns rather than echoes, so the caller picks the output medium.
     */
    public function describeAssembly(): string
    {
        return sprintf('No assembly schedule is published for the %s.', $this->name);
    }
}

class TeslaCar extends Car
{
    /**
     * The Tesla-specific sentence now lives with Tesla, not in the generic
     * parent. A plain override — no new abstractions required.
     */
    public function describeAssembly(): string
    {
        return sprintf('The %s finishes assembly every Friday at 5pm.', $this->getName());
    }

    /**
     * One responsibility each, instead of one method doing all three.
     */
    public function generateReport(): string
    {
        return 'Generating assembly reports...';
    }

    public function exportReportToCsv(): string
    {
        return 'Exporting CSV format reports...';
    }

    public function printReport(): string
    {
        return 'Printing reports...';
    }

    /**
     * The original method, kept as a thin orchestrator so existing call sites
     * still work — but callers who want only the CSV can now reach one step
     * directly instead of triggering all three.
     *
     * @return list<string>
     */
    public function generateAssemblyReports(): array
    {
        return [
            $this->generateReport(),
            $this->exportReportToCsv(),
            $this->printReport(),
        ];
    }
}

// --- Calling code -----------------------------------------------------------
// Output formatting is the caller's job. PHP_EOL rather than "<br>" so this runs
// identically in a browser and on the command line.

$car = new TeslaCar('Model_3');

echo $car->getName(), PHP_EOL;          // "Model_3" — actually prints now
echo $car->describeAssembly(), PHP_EOL; // "The Model_3 finishes assembly every Friday at 5pm."

foreach ($car->generateAssemblyReports() as $line) {
    echo $line, PHP_EOL;
}
```

**Verified output** (PHP 8.4, exit code 0, no notices or warnings):

```
Model_3
The Model_3 finishes assembly every Friday at 5pm.
Generating assembly reports...
Exporting CSV format reports...
Printing reports...
```

---

## Summary of changes

| # | Issue | Change | Why |
|---|-------|--------|-----|
| 1 | Constructor ignores `"Model_3"` | Promoted `__construct(private readonly string $name)` | Silent data-loss bug — `get_name()` returned nothing |
| 2 | No type declarations | Typed property, parameter, return types | Contract enforced; makes bug 1 impossible to repeat |
| 3 | `public $name` beside a getter | `private readonly` | The two contradicted each other |
| 4 | "Tesla" hardcoded in `Car` | Override `describeAssembly()` in `TeslaCar` | A parent must not depend on one child's details |
| 5 | One method, three jobs | Split into three; original kept as orchestrator | Steps usable in isolation; call site unchanged |
| 6 | `echo` inside classes | Methods return strings | Testable and reusable outside a web page |
| 7 | `snake_case` methods | `camelCase` | PSR-12 |
| 8 | Implicit visibility | Explicit `public` | PSR-12; intent is stated |
| 9 | `echo "<br>"` | `PHP_EOL` at the call site | Presentation is the caller's concern |
| 10 | Closing `?>` | Removed | Trailing whitespace causes "headers already sent" |
| 11 | No strict types | `declare(strict_types=1)` | Catches type errors at the boundary |

---

## Possible future improvements

These are **not** applied above. Each is defensible, but each also changes the
design rather than correcting a defect, and that is more than this snippet warrants.
They are recorded here to show the reasoning was considered and consciously
declined.

### 1. Make `Car` abstract

```php
abstract class Car
{
    abstract public function assemblySchedule(): string;
}
```

This would force every subclass to state its own schedule, making the issue-4 bug
unrepresentable rather than merely fixed. **Why not now:** it makes `Car`
non-instantiable, which the original permitted, and it invents a contract the
snippet never asked for. Worth doing the moment a second subclass appears.

### 2. Extract the reporting into its own class

```php
final class AssemblyReporter
{
    public function __construct(private readonly Car $car)
    {
    }

    public function generate(): string
    {
        return sprintf('Generating assembly report for %s...', $this->car->getName());
    }
}
```

Strictly, reporting is not part of what a car *is* — it is a separate concern that
operates on a car, and extracting it would keep `TeslaCar` from growing with every
new report format. **Why not now:** it doubles the class count of a 20-line snippet
to solve a problem it does not yet have. The split in issue 5 already delivers most
of the benefit at a fraction of the cost.

### 3. Mark `TeslaCar` as `final`

Signals that it is not designed for further subclassing. **Why not now:** the
original placed no such restriction, and adding one is a design decision rather than
a correction.

### 4. Give the reports a value object instead of strings

`generateAssemblyReports(): array` returning strings is fine here, but a real
reporting feature would return a structured `Report` object with a format and a
payload rather than pre-rendered English. **Why not now:** far beyond a snippet
whose entire output is three `echo` statements.
