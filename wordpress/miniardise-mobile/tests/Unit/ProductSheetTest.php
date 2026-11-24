<?php

declare(strict_types=1);

namespace MiniarDise\Mobile\Tests\Unit;

use MiniarDise\Mobile\Catalog\ProductSheet;
use PHPUnit\Framework\TestCase;

final class ProductSheetTest extends TestCase {
	private static function cell(): callable {
		return static function ( array $n, string $key, float $ratio ): string {
			if ( 'energy' === $key ) {
				return round( $n['kj'] * $ratio ) . ' kJ / ' . round( $n['kcal'] * $ratio ) . ' kcal';
			}
			return null === ( $n[ $key ] ?? null ) ? '—' : str_replace( '.', ',', (string) round( $n[ $key ] * $ratio, 1 ) ) . ' g';
		};
	}

	private static function sheet(): array {
		return array(
			'lead'      => 'L’amande de Californie.',
			'text'      => "Avec sa fine peau brune.\n\nÀ croquer nature.",
			'details'   => array( array( 'Origine', 'États-Unis' ), array( 'Allergènes', 'Fruits à coque.' ), array( '', '' ) ),
			'benefits'  => array( 'Riche en vitamine E.' ),
			'benefits_title' => '',
			'recipes'   => array( array( 'Amandes grillées', '10 minutes à 170 °C.' ) ),
			'nutrition' => array( 'kj' => 2620, 'kcal' => 634, 'fat' => 53, 'sat' => 4.2, 'carb' => 7.9, 'sugar' => 4.4, 'fibre' => null, 'prot' => 25, 'salt' => 0.05, 'source' => 'fournisseur', 'note' => '' ),
			'storage'   => array( 'Au sec.' ),
			'recycling' => array( 'Sachet : bac jaune.' ),
		);
	}

	public function test_normalizes_like_the_site(): void {
		$s = ProductSheet::normalize( self::sheet(), array( '200 g', '500 g' ), self::cell() );
		self::assertSame( 'L’amande de Californie.', $s['lead'] );
		self::assertSame( "Avec sa fine peau brune.\n\nÀ croquer nature.", $s['text'] );
		self::assertSame( 'Bienfaits sur la santé', $s['benefits_title'] );
		self::assertSame( ProductSheet::BENEFITS_NOTE, $s['benefits_note'] );
		self::assertCount( 3, $s['details'] ); // ligne vide ignorée + formats ajoutés
		self::assertSame( array( 'label' => 'Formats disponibles', 'value' => '200 g, 500 g' ), $s['details'][2] );
		self::assertSame( array( 'title' => 'Amandes grillées', 'body' => '10 minutes à 170 °C.' ), $s['recipes'][0] );
	}

	public function test_nutrition_table_per_100g_and_30g_portion_without_missing_fibre(): void {
		$rows = ProductSheet::normalize( self::sheet(), array(), self::cell() )['nutrition']['rows'];
		self::assertNotContains( 'fibre', array_column( $rows, 'key' ) );
		self::assertSame( '2620 kJ / 634 kcal', $rows[0]['per_100g'] );
		self::assertSame( '786 kJ / 190 kcal', $rows[0]['per_portion'] );
		self::assertTrue( $rows[2]['sub'] ); // « dont acides gras saturés »
	}

	public function test_no_nutrition_and_fallback_description(): void {
		$sheet = array( 'lead' => '', 'text' => '', 'nutrition' => array( 'kj' => null, 'kcal' => null, 'fat' => null, 'prot' => null ) );
		$s     = ProductSheet::normalize( $sheet, array(), self::cell(), '<p>Description&nbsp;d’origine</p><script>x()</script>' );
		self::assertNull( $s['nutrition'] );
		self::assertSame( 'Description d’origine', $s['text'] );
	}

	public function test_nutrition_note_matches_site_rules(): void {
		self::assertSame( 'Valeurs nutritionnelles moyennes communiquées par le fournisseur.', ProductSheet::nutritionNote( 'fournisseur', '' ) );
		self::assertSame( 'Valeurs de la noisette (Ciqual).', ProductSheet::nutritionNote( 'ciqual', 'Valeurs de la noisette (Ciqual).' ) );
	}
}
