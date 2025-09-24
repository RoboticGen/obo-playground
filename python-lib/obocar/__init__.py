"""
Obo Car Simulation Library
A lightweight Python library for simulating car dynamics and physics.
Designed to work with Pyodide in browser environments.
"""

from .vehicle import OboChar

__version__ = "0.1.0"
__author__ = "Obo Car Team"

# Make obocar class available at package level
def obocar():
    """Create and return a new OboChar instance."""
    return OboChar()

__all__ = ['obocar', 'OboChar']