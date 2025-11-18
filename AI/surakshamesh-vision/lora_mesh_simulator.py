"""
SurakshaMesh X - LoRa Mesh Network Offline Demo
Shows how workers stay connected even without WiFi/Internet
"""

import time
import random
from datetime import datetime

# Simulated LoRa Mesh Network
class LoRaNode:
    def __init__(self, node_id, name, location, node_type="worker"):
        self.node_id = node_id
        self.name = name
        self.location = location  # (x, y) coordinates
        self.node_type = node_type  # "worker", "relay", "gateway"
        self.battery = 100
        self.connected_nodes = []
        self.message_queue = []
        
    def can_reach(self, other_node, max_range=100):
        """Check if node is within LoRa range"""
        dx = self.location[0] - other_node.location[0]
        dy = self.location[1] - other_node.location[1]
        distance = (dx**2 + dy**2)**0.5
        return distance <= max_range


class LoRaMeshNetwork:
    def __init__(self):
        self.nodes = {}
        self.messages = []
        
    def add_node(self, node):
        self.nodes[node.node_id] = node
        
    def build_mesh(self, max_range=100):
        """Auto-connect nodes within range"""
        for node_id, node in self.nodes.items():
            node.connected_nodes = []
            for other_id, other_node in self.nodes.items():
                if node_id != other_id and node.can_reach(other_node, max_range):
                    node.connected_nodes.append(other_id)
                    
    def send_message(self, from_id, to_id, data, route=None):
        """Route message through mesh network"""
        if route is None:
            route = [from_id]
            
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # If direct connection
        if to_id in self.nodes[from_id].connected_nodes:
            route.append(to_id)
            self.messages.append({
                "from": from_id,
                "to": to_id,
                "data": data,
                "route": route,
                "hops": len(route) - 1,
                "timestamp": timestamp
            })
            return route
            
        # Find route through mesh
        for neighbor_id in self.nodes[from_id].connected_nodes:
            if neighbor_id not in route:
                new_route = route + [neighbor_id]
                result = self.send_message(neighbor_id, to_id, data, new_route)
                if result:
                    return result
        
        return None
    
    def visualize_network(self):
        """Print network topology"""
        print("\n" + "="*70)
        print("🔗 LoRa MESH NETWORK TOPOLOGY")
        print("="*70)
        
        for node_id, node in self.nodes.items():
            icon = "👷" if node.node_type == "worker" else "📡" if node.node_type == "relay" else "🌐"
            print(f"\n{icon} {node.name} (ID: {node_id})")
            print(f"   Type: {node.node_type.upper()}")
            print(f"   Location: {node.location}")
            print(f"   Battery: {node.battery}%")
            print(f"   Connected to: {len(node.connected_nodes)} nodes")
            if node.connected_nodes:
                for conn_id in node.connected_nodes:
                    conn_node = self.nodes[conn_id]
                    print(f"      ↔ {conn_node.name}")
        
        print("\n" + "="*70)
    
    def visualize_messages(self):
        """Print message routing history"""
        print("\n" + "="*70)
        print("📨 MESSAGE ROUTING LOG (Last 5)")
        print("="*70)
        
        for msg in self.messages[-5:]:
            from_name = self.nodes[msg['from']].name
            to_name = self.nodes[msg['to']].name
            route_names = " → ".join([self.nodes[r].name for r in msg['route']])
            
            print(f"\n[{msg['timestamp']}] {from_name} → {to_name}")
            print(f"  Data: {msg['data']}")
            print(f"  Route: {route_names}")
            print(f"  Hops: {msg['hops']}")
        
        print("\n" + "="*70)


def demo_lora_mesh():
    """Run LoRa Mesh demonstration"""
    
    print("\n" + "="*70)
    print("🚀 SurakshaMesh X - LoRa Mesh Network Demo")
    print("   Demonstrating OFFLINE worker connectivity")
    print("="*70)
    
    # Create mesh network
    mesh = LoRaMeshNetwork()
    
    # Add worker nodes (scattered across factory)
    mesh.add_node(LoRaNode("WKR-001", "Rajesh Kumar", (0, 0), "worker"))
    mesh.add_node(LoRaNode("WKR-002", "Amit Singh", (80, 30), "worker"))
    mesh.add_node(LoRaNode("WKR-003", "Priya Sharma", (150, 10), "worker"))
    mesh.add_node(LoRaNode("WKR-004", "Vikram Patel", (50, 90), "worker"))
    
    # Add relay nodes (extend range)
    mesh.add_node(LoRaNode("RELAY-01", "Relay-Furnace", (75, 50), "relay"))
    mesh.add_node(LoRaNode("RELAY-02", "Relay-Storage", (120, 70), "relay"))
    
    # Add gateway (connects to backend when online)
    mesh.add_node(LoRaNode("GATEWAY", "Main Gateway", (100, 100), "gateway"))
    
    # Build mesh connections
    mesh.build_mesh(max_range=80)
    
    # Show network topology
    mesh.visualize_network()
    
    time.sleep(2)
    
    # Simulate messages
    print("\n\n🔴 SIMULATING REAL-TIME MESSAGE ROUTING...\n")
    time.sleep(1)
    
    # Worker sends SOS
    print("⚠️  Worker WKR-001 (Rajesh) sends SOS!")
    mesh.send_message("WKR-001", "GATEWAY", {
        "type": "SOS",
        "worker": "Rajesh Kumar",
        "risk": 95,
        "location": "Furnace-A"
    })
    time.sleep(1)
    
    # Worker sends vitals
    print("💓 Worker WKR-003 (Priya) sends health data")
    mesh.send_message("WKR-003", "GATEWAY", {
        "type": "VITALS",
        "hr": 145,
        "spo2": 89,
        "temp": 38.2
    })
    time.sleep(1)
    
    # Worker-to-worker communication
    print("👷 Worker WKR-002 alerts WKR-004 about hazard")
    mesh.send_message("WKR-002", "WKR-004", {
        "type": "ALERT",
        "message": "Gas leak detected near Storage Area"
    })
    time.sleep(1)
    
    # Show routing logs
    mesh.visualize_messages()
    
    # Show offline capability
    print("\n" + "="*70)
    print("🔴 SIMULATING INTERNET OUTAGE")
    print("="*70)
    print("✅ LoRa Mesh Network: OPERATIONAL")
    print("✅ Worker-to-Worker: CONNECTED")
    print("✅ Emergency Messages: ROUTING")
    print("❌ Cloud Sync: OFFLINE (will sync when back online)")
    print("="*70)
    
    # Network stats
    print("\n📊 NETWORK STATISTICS")
    print("="*70)
    print(f"Total Nodes: {len(mesh.nodes)}")
    print(f"Workers: {sum(1 for n in mesh.nodes.values() if n.node_type == 'worker')}")
    print(f"Relays: {sum(1 for n in mesh.nodes.values() if n.node_type == 'relay')}")
    print(f"Gateways: {sum(1 for n in mesh.nodes.values() if n.node_type == 'gateway')}")
    print(f"Messages Routed: {len(mesh.messages)}")
    print(f"Average Hops: {sum(m['hops'] for m in mesh.messages) / len(mesh.messages):.1f}")
    print("="*70)


if __name__ == "__main__":
    demo_lora_mesh()