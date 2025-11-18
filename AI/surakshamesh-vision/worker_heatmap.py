"""
SurakshaMesh X - 3D Worker Risk Heatmap
Shows worker positions and risk zones in factory
"""

import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from matplotlib import cm
import random

# Worker data with real-time risk scores
workers = [
    {"id": "WKR-2401-M", "name": "Rajesh Kumar", "x": 10, "y": 20, "z": 0, "risk": 85, "zone": "Furnace-A"},
    {"id": "WKR-2402-M", "name": "Amit Singh", "x": 25, "y": 15, "z": 0, "risk": 45, "zone": "Assembly"},
    {"id": "WKR-2403-F", "name": "Priya Sharma", "x": 40, "y": 30, "z": 0, "risk": 25, "zone": "Storage"},
    {"id": "WKR-2404-M", "name": "Vikram Patel", "x": 35, "y": 5, "z": 0, "risk": 92, "zone": "Chemical"},
    {"id": "WKR-2405-F", "name": "Neha Gupta", "x": 15, "y": 35, "z": 0, "risk": 38, "zone": "Packaging"},
    {"id": "WKR-2406-M", "name": "Suresh Reddy", "x": 5, "y": 10, "z": 0, "risk": 67, "zone": "Furnace-B"},
]


def create_3d_heatmap():
    """Generate 3D heatmap with worker positions"""
    
    fig = plt.figure(figsize=(14, 10))
    ax = fig.add_subplot(111, projection='3d')
    
    # Factory floor grid
    x_grid = np.linspace(0, 50, 50)
    y_grid = np.linspace(0, 40, 40)
    X, Y = np.meshgrid(x_grid, y_grid)
    
    # Generate risk heatmap based on worker positions
    Z = np.zeros_like(X)
    
    for worker in workers:
        # Create risk influence zone around each worker
        distance = np.sqrt((X - worker['x'])**2 + (Y - worker['y'])**2)
        influence = worker['risk'] * np.exp(-distance / 5)  # Exponential decay
        Z += influence
    
    # Plot surface heatmap
    surf = ax.plot_surface(X, Y, Z, cmap=cm.coolwarm, alpha=0.6, 
                          linewidth=0, antialiased=True)
    
    # Plot worker positions as 3D scatter
    worker_x = [w['x'] for w in workers]
    worker_y = [w['y'] for w in workers]
    worker_z = [w['risk'] for w in workers]
    worker_colors = [w['risk'] for w in workers]
    
    scatter = ax.scatter(worker_x, worker_y, worker_z, 
                        c=worker_colors, cmap='RdYlGn_r', 
                        s=300, marker='o', edgecolors='black', linewidths=2,
                        alpha=0.9, depthshade=True)
    
    # Add worker labels
    for worker in workers:
        ax.text(worker['x'], worker['y'], worker['risk'] + 5, 
               f"{worker['name']}\nRisk: {worker['risk']}%", 
               fontsize=8, ha='center', bbox=dict(boxstyle='round', 
               facecolor='white', alpha=0.8))
    
    # Styling
    ax.set_xlabel('Factory X-axis (meters)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Factory Y-axis (meters)', fontsize=12, fontweight='bold')
    ax.set_zlabel('Risk Score', fontsize=12, fontweight='bold')
    ax.set_title('SurakshaMesh X - 3D Worker Risk Heatmap\nReal-Time Factory Safety Visualization', 
                fontsize=16, fontweight='bold', pad=20)
    
    # Color bars
    cbar_surf = fig.colorbar(surf, ax=ax, shrink=0.5, aspect=5, pad=0.1)
    cbar_surf.set_label('Risk Intensity', fontsize=10, fontweight='bold')
    
    cbar_scatter = fig.colorbar(scatter, ax=ax, shrink=0.5, aspect=5, pad=0.15)
    cbar_scatter.set_label('Worker Risk Score', fontsize=10, fontweight='bold')
    
    # Set viewing angle
    ax.view_init(elev=25, azim=45)
    
    # Grid
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('surakshamesh_3d_heatmap.png', dpi=300, bbox_inches='tight')
    print("✅ 3D Heatmap saved as: surakshamesh_3d_heatmap.png")
    plt.show()


def create_2d_worker_map():
    """Create 2D top-down view of worker positions"""
    
    fig, ax = plt.subplots(figsize=(12, 10))
    
    # Factory zones (background)
    zones = [
        {"name": "Furnace-A", "bounds": [5, 15, 15, 25], "color": "#ff6b6b"},
        {"name": "Assembly", "bounds": [20, 30, 10, 20], "color": "#4ecdc4"},
        {"name": "Storage", "bounds": [35, 45, 25, 35], "color": "#95e1d3"},
        {"name": "Chemical", "bounds": [30, 40, 0, 10], "color": "#f38181"},
        {"name": "Packaging", "bounds": [10, 20, 30, 40], "color": "#a8e6cf"},
        {"name": "Furnace-B", "bounds": [0, 10, 5, 15], "color": "#ffd3b6"},
    ]
    
    for zone in zones:
        x1, x2, y1, y2 = zone['bounds']
        ax.add_patch(plt.Rectangle((x1, y1), x2-x1, y2-y1, 
                                   facecolor=zone['color'], alpha=0.3, 
                                   edgecolor='black', linewidth=2))
        ax.text((x1+x2)/2, (y1+y2)/2, zone['name'], 
               ha='center', va='center', fontsize=11, fontweight='bold')
    
    # Plot workers
    for worker in workers:
        # Color based on risk
        if worker['risk'] >= 70:
            color = '#ff0000'  # Red - High risk
            size = 500
        elif worker['risk'] >= 40:
            color = '#ffa500'  # Orange - Medium risk
            size = 400
        else:
            color = '#00ff00'  # Green - Low risk
            size = 300
        
        ax.scatter(worker['x'], worker['y'], s=size, c=color, 
                  edgecolors='black', linewidths=2, alpha=0.8, zorder=10)
        
        # Label
        ax.annotate(f"{worker['name']}\n{worker['risk']}% risk", 
                   xy=(worker['x'], worker['y']), xytext=(5, 5),
                   textcoords='offset points', fontsize=9,
                   bbox=dict(boxstyle='round,pad=0.5', fc='white', alpha=0.9),
                   arrowprops=dict(arrowstyle='->', lw=1.5))
    
    # Styling
    ax.set_xlim(0, 50)
    ax.set_ylim(0, 40)
    ax.set_xlabel('Factory Floor - X axis (meters)', fontsize=12, fontweight='bold')
    ax.set_ylabel('Factory Floor - Y axis (meters)', fontsize=12, fontweight='bold')
    ax.set_title('SurakshaMesh X - Worker Location & Risk Map (2D Top View)', 
                fontsize=14, fontweight='bold', pad=15)
    ax.grid(True, alpha=0.3, linestyle='--')
    ax.set_aspect('equal')
    
    # Legend
    legend_elements = [
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='#ff0000', 
                  markersize=10, label='High Risk (≥70%)'),
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='#ffa500', 
                  markersize=10, label='Medium Risk (40-69%)'),
        plt.Line2D([0], [0], marker='o', color='w', markerfacecolor='#00ff00', 
                  markersize=10, label='Low Risk (<40%)')
    ]
    ax.legend(handles=legend_elements, loc='upper right', fontsize=10)
    
    plt.tight_layout()
    plt.savefig('surakshamesh_2d_worker_map.png', dpi=300, bbox_inches='tight')
    print("✅ 2D Worker Map saved as: surakshamesh_2d_worker_map.png")
    plt.show()


if __name__ == "__main__":
    print("=" * 70)
    print("🚀 SurakshaMesh X - Worker Heatmap Generator")
    print("=" * 70)
    print("\nGenerating visualizations...")
    
    create_3d_heatmap()
    create_2d_worker_map()
    
    print("\n✅ All visualizations generated successfully!")
    print("=" * 70)